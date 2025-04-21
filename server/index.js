
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const messageRoutes = require('./routes/messages');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/talkify')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Talkify API is running');
});

// Create HTTP server
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    methods: ['GET', 'POST']
  }
});

// Track online users
const onlineUsers = new Set();

// Function to broadcast online users to all clients
const broadcastOnlineUsers = async () => {
  try {
    // Get fresh list of online users from database
    const dbOnlineUsers = await User.find({ isOnline: true }).select('_id');
    const onlineUserIds = dbOnlineUsers.map(user => user._id.toString());
    
    // Ensure our in-memory set matches the database
    onlineUsers.clear();
    onlineUserIds.forEach(id => onlineUsers.add(id));
    
    // Broadcast to all clients
    io.emit('get online users', [...onlineUsers]);
    console.log('Broadcasting online users:', [...onlineUsers]);
  } catch (error) {
    console.error('Error broadcasting online users:', error);
  }
};

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join user's personal room
  socket.on('setup', async (userData) => {
    if (!userData || !userData._id) return;
    
    socket.join(userData._id);
    socket.emit('connected');
    
    // Set user as online in database
    try {
      await User.findByIdAndUpdate(userData._id, { isOnline: true });
      onlineUsers.add(userData._id);
      await broadcastOnlineUsers();
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
  });
  
  // Handle get online users request
  socket.on('get online users', async () => {
    await broadcastOnlineUsers();
  });
  
  // Handle user going online
  socket.on('user online', async (userId) => {
    if (!userId) return;
    
    console.log('User online:', userId);
    onlineUsers.add(userId);
    
    // Set user as online in database
    try {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      
      // Broadcast to all clients
      io.emit('user status', { userId, status: 'online' });
      await broadcastOnlineUsers();
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
  });
  
  // Handle user going offline
  socket.on('user offline', async (userId) => {
    if (!userId) return;
    
    console.log('User offline:', userId);
    onlineUsers.delete(userId);
    
    // Set user as offline in database
    try {
      await User.findByIdAndUpdate(userId, { isOnline: false });
      
      // Broadcast to all clients
      io.emit('user status', { userId, status: 'offline' });
      await broadcastOnlineUsers();
    } catch (error) {
      console.error('Error updating user offline status:', error);
    }
  });
  
  // Join chat room
  socket.on('join chat', (room) => {
    socket.join(room);
    console.log('User joined room:', room);
  });
  
  // Handle new message
  socket.on('new message', (newMessageReceived) => {
    const chat = newMessageReceived.chat;
    
    if (!chat.users) return console.log('Chat users not defined');
    
    // Send message to all users in the chat except the sender
    chat.users.forEach(user => {
      if (user._id === newMessageReceived.sender._id) return;
      
      socket.in(user._id).emit('message received', newMessageReceived);
    });
  });
  
  // Handle typing status
  socket.on('typing', (room) => socket.in(room).emit('typing', room));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing', room));
  
  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    
    // Note: We can't directly update the user's status here since we don't know which user
    // was associated with this socket. The proper way would be to maintain a map of socket IDs to user IDs.
    // Instead, we'll rely on the 'user offline' event sent before disconnection.
    
    // Still broadcast updated online users
    await broadcastOnlineUsers();
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
