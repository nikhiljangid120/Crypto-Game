const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  currency: { type: String, required: true },
  balance: { type: Number, default: 0 }
});

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true },
  wallets: [walletSchema]
});

module.exports = mongoose.model('Player', playerSchema);