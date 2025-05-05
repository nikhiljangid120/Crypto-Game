const mongoose = require('mongoose');
const Player = require('./models/player'); // Adjust path as needed

mongoose.connect('mongodb://localhost/crypto-crash', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');

  // Clear existing players
  await Player.deleteMany({});

  // Create sample players
  const players = [
    { username: 'player1', wallets: [{ currency: 'BTC', balance: 0.001 }, { currency: 'ETH', balance: 0.01 }] },
    { username: 'player2', wallets: [{ currency: 'BTC', balance: 0.002 }, { currency: 'ETH', balance: 0.02 }] },
    { username: 'player3', wallets: [{ currency: 'BTC', balance: 0.003 }, { currency: 'ETH', balance: 0.03 }] }
  ];

  const inserted = await Player.insertMany(players);
  console.log('Players created:', inserted.map(p => p._id));
  mongoose.connection.close();
}).catch(err => {
  console.error('Error:', err);
  mongoose.connection.close();
});