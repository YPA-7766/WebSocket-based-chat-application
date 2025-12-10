const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors()); //initialise CORS middleware

// Initialize Socket.io with CORS settings
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // React default port
    methods: ["GET", "POST"]
  }
});


const activeUsers = new Map();


io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user joined event
  socket.on('user_joined', (username) => {
    activeUsers.set(socket.id, username);
    console.log(`${username} joined the chat`);