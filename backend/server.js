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
    
    // Broadcast to all clients that a user joined
    io.emit('user_joined', {
      username: username,
      timestamp: new Date().toISOString()
    });
  });

  // Handle incoming chat messages
  socket.on('chat_message', (data) => {
    console.log('Message received:', data);
    
    // Broadcast message to ALL clients (including sender)
    io.emit('chat_message', {
      username: data.username,
      message: data.message,
      timestamp: new Date().toISOString(),
      id: Date.now() // Simple unique ID
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = activeUsers.get(socket.id);
    if (username) {
      console.log(`${username} disconnected`);
      activeUsers.delete(socket.id);
      
      io.emit('user_left', {
        username: username,
        timestamp: new Date().toISOString()
      });
    }
  });
});

// Start server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
