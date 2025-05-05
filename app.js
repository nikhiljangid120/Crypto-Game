const express = require('express');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const http = require('http');
const GameService = require('./services/gameService');
const betController = require('./controllers/betController');
const walletController = require('./controllers/walletController');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect('mongodb://localhost/crypto-crash', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.post('/bets', betController.placeBet);
app.get('/wallet/:player_id', walletController.getWallet);

// Start Game Service
const gameService = new GameService(io);
gameService.startBettingPhase();

// WebSocket Handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('cashout', (data) => gameService.handleCashout(socket, data));
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Start Server
server.listen(3000, () => {
  console.log('Server running on port 3000');
});