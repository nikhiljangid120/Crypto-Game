const GameRound = require('../models/GameRound');
const Player = require('../models/Player');
const TransactionLog = require('../models/TransactionLog');
const { getCurrentPrice } = require('../utils/cryptoPrice');
const crypto = require('crypto');

class GameService {
  constructor(io) {
    this.io = io;
    this.currentRound = null;
    this.timer = null;
    this.k = 0.2; // Growth rate for multiplier
  }

  async startBettingPhase() {
    const seed = crypto.randomBytes(16).toString('hex');
    const seedHash = crypto.createHash('sha256').update(seed).digest('hex');
    this.currentRound = new GameRound({
      status: 'betting',
      seed,
      seed_hash: seedHash,
      bets: [],
      cashouts: []
    });
    await this.currentRound.save();
    this.io.emit('betting_start', { round_id: this.currentRound._id, seed_hash: seedHash });
    console.log(`Betting phase started for round ${this.currentRound._id}`);
    setTimeout(() => this.startRound(), 10000); // 10 seconds betting phase
  }

  async startRound() {
    if (!this.currentRound) return;
    this.currentRound.status = 'running';
    this.currentRound.start_time = new Date();
    const hash = crypto.createHash('sha256').update(this.currentRound.seed + this.currentRound._id).digest('hex');
    const hashValue = parseInt(hash.substr(0, 8), 16);
    const crashPoint = 1 + (hashValue / 0xffffffff) * 99; // Crash point between 1x and 100x
    this.currentRound.crash_point = crashPoint;
    await this.currentRound.save();
    this.io.emit('round_start', { round_id: this.currentRound._id });
    console.log(`Round ${this.currentRound._id} started with crash point ${crashPoint}`);
    this.timer = setInterval(() => this.updateMultiplier(), 100);
  }

  updateMultiplier() {
    if (!this.currentRound || this.currentRound.status !== 'running') return;
    const timeElapsed = (Date.now() - this.currentRound.start_time) / 1000; // in seconds
    const multiplier = Math.exp(this.k * timeElapsed);
    this.io.emit('multiplier_update', { round_id: this.currentRound._id, multiplier: multiplier.toFixed(2) });
    if (multiplier >= this.currentRound.crash_point) {
      this.crashRound();
    }
  }

  async crashRound() {
    clearInterval(this.timer);
    this.currentRound.status = 'crashed';
    await this.currentRound.save();
    this.io.emit('round_crash', {
      round_id: this.currentRound._id,
      crash_point: this.currentRound.crash_point.toFixed(2),
      seed: this.currentRound.seed
    });
    console.log(`Round ${this.currentRound._id} crashed at ${this.currentRound.crash_point}`);
    setInterval(() => this.startBettingPhase(), 20000);
  }

  async handleCashout(socket, data) {
    const { player_id, round_id } = data;
    if (this.currentRound && this.currentRound._id.toString() === round_id && this.currentRound.status === 'running') {
      const bet = this.currentRound.bets.find(b => b.player_id.toString() === player_id);
      if (bet && !this.currentRound.cashouts.some(c => c.player_id.toString() === player_id)) {
        const timeElapsed = (Date.now() - this.currentRound.start_time) / 1000;
        const multiplier = Math.exp(this.k * timeElapsed);
        const payout_crypto = bet.crypto_amount * multiplier;
        const price = getCurrentPrice(bet.currency);
        const payout_usd = payout_crypto * price;

        const player = await Player.findById(player_id);
        const wallet = player.wallets.find(w => w.currency === bet.currency);
        wallet.balance += payout_crypto;
        await player.save();

        const transactionHash = crypto.randomBytes(16).toString('hex');
        const transactionLog = new TransactionLog({
          player_id,
          round_id: this.currentRound._id,
          transaction_type: 'cashout',
          usd_amount: payout_usd,
          crypto_amount: payout_crypto,
          currency: bet.currency,
          transaction_hash: transactionHash,
          price_at_time: price
        });
        await transactionLog.save();

        this.currentRound.cashouts.push({ player_id, multiplier, payout_crypto, payout_usd });
        await this.currentRound.save();

        this.io.emit('player_cashout', {
          player_id,
          multiplier: multiplier.toFixed(2),
          payout_crypto,
          payout_usd
        });
        console.log(`Player ${player_id} cashed out at ${multiplier.toFixed(2)}x`);
      }
    }
  }
}

module.exports = GameService;