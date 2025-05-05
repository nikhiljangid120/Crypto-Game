const mongoose = require('mongoose');

const transactionLogSchema = new mongoose.Schema({
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  round_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GameRound' },
  transaction_type: { type: String, enum: ['bet', 'cashout'], required: true },
  usd_amount: Number,
  crypto_amount: Number,
  currency: { type: String, required: true },
  transaction_hash: { type: String, required: true },
  price_at_time: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TransactionLog', transactionLogSchema);