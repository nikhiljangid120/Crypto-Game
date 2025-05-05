const Player = require('../models/Player');
const { getCurrentPrice } = require('../utils/cryptoPrice');

exports.getWallet = async (req, res) => {
  const { player_id } = req.params;
  const player = await Player.findById(player_id);
  if (!player) {
    return res.status(404).json({ message: 'Player not found' });
  }

  const walletWithUsd = player.wallets.map(wallet => ({
    currency: wallet.currency,
    balance: wallet.balance,
    usd_equivalent: wallet.balance * (getCurrentPrice(wallet.currency) || 0)
  }));

  res.json({ player_id, wallets: walletWithUsd });
};