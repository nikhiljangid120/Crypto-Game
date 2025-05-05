const Player = require('../models/Player');
const GameRound = require('../models/GameRound');
const TransactionLog = require('../models/TransactionLog');
const { getCurrentPrice } = require('../utils/cryptoPrice');
const crypto = require('crypto');

exports.placeBet = async (req, res) => {
  const { player_id, usd_amount, currency } = req.body;
  if (!player_id || !usd_amount || !currency || usd_amount <= 0) {
    return res.status(400).json({ message: 'Invalid bet data' });
  }

  const currentRound = await GameRound.findOne({ status: 'betting' });
  if (!currentRound) {
    return res.status(400).json({ message: 'No betting round active' });
  }

  const price = getCurrentPrice(currency);
  if (!price) {
    return res.status(500).json({ message: 'Price not available' });
  }

  const crypto_amount = usd_amount / price;
  const player = await Player.findById(player_id);
  if (!player) {
    return res.status(404).json({ message: 'Player not found' });
  }

  const wallet = player.wallets.find(w => w.currency === currency);
  if (!wallet || wallet.balance < crypto_amount) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }

  wallet.balance -= crypto_amount;
  await player.save();

  currentRound.bets.push({ player_id, usd_amount, currency, crypto_amount });
  await currentRound.save();

  const transactionHash = crypto.randomBytes(16).toString('hex');
  const transactionLog = new TransactionLog({
    player_id,
    round_id: currentRound._id,
    transaction_type: 'bet',
    usd_amount,
    crypto_amount,
    currency,
    transaction_hash: transactionHash,
    price_at_time: price
  });
  await transactionLog.save();

  res.json({ message: 'Bet placed', bet: { player_id, usd_amount, currency, crypto_amount } });
};