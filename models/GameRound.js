const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  usd_amount: { type: Number, required: true },
  currency: { type: String, required: true },
  crypto_amount: { type: Number, required: true }
});

const cashoutSchema = new mongoose.Schema({
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  multiplier: { type: Number, required: true },
  payout_crypto: { type: Number, required: true },
  payout_usd: { type: Number, required: true }
});

const gameRoundSchema = new mongoose.Schema({
  status: { type: String, enum: ['betting', 'running', 'crashed'], default: 'betting' },
  start_time: Date,
  crash_point: Number,
  seed: String,
  seed_hash: String,
  bets: [betSchema],
  cashouts: [cashoutSchema]
});

module.exports = mongoose.model('GameRound', gameRoundSchema);