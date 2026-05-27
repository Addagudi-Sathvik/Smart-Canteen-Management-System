const { Server } = require('socket.io');
const env = require('../config/env');

let io;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    // Join a room based on user role
    socket.on('join:role', (role) => {
      socket.join(`role:${role}`);
      console.log(`Socket ${socket.id} joined role:${role}`);
    });

    // Join a room for order-specific updates
    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    // Join staff room for live queue
    socket.on('join:staff', () => {
      socket.join('staff');
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`⚡ Client disconnected: ${socket.id} (${reason})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error (${socket.id}):`, error.message);
    });
  });

  console.log('🔌 Socket.io initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
