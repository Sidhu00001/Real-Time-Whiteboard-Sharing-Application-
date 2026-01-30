import express from "express";
import http from "http";
import { Server } from "socket.io";
import { 
  addUser, 
  removeUserBySocketId, 
  getUserInRoom 
} from "./utils/user.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Configure this properly in production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8000;

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "Server is running perfectly",
    timestamp: new Date().toISOString()
  });
});

// Store room data
const roomData = new Map(); // roomId -> { imageUrl, elements }

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // ===== User Joined Room =====
  socket.on("userJoined", (data) => {
    try {
      const { name, userId, roomId, host, presenter } = data;
      
      if (!name || !userId || !roomId) {
        socket.emit("error", { message: "Missing required fields" });
        return;
      }

      // Join the room
      socket.join(roomId);
      
      // Add user with socketId
      const users = addUser({
        ...data,
        socketId: socket.id
      });

      console.log(`👤 ${name} joined room ${roomId} (Presenter: ${presenter})`);

      // Send success to the joining user
      socket.emit("userIsJoined", { 
        success: true, 
        users,
        roomId 
      });

      // Broadcast to others in the room
      socket.broadcast.to(roomId).emit("userJoinedMessageBroadcasted", name);
      socket.broadcast.to(roomId).emit("allUsersInRoom", { users });

      // Send existing whiteboard data to the new user
      const roomInfo = roomData.get(roomId);
      if (roomInfo && roomInfo.imageUrl) {
        socket.emit("whiteBoardDataResponse", { 
          imageUrl: roomInfo.imageUrl 
        });
      }
    } catch (error) {
      console.error("Error in userJoined:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // ===== Whiteboard Drawing Data =====
  socket.on("whiteBoard", (data) => {
    try {
      const rooms = Array.from(socket.rooms);
      const roomId = rooms.find(room => room !== socket.id);

      if (!roomId) {
        console.warn("No room found for socket:", socket.id);
        return;
      }

      // Store the whiteboard image for this room
      if (!roomData.has(roomId)) {
        roomData.set(roomId, {});
      }
      roomData.get(roomId).imageUrl = data;

      // Broadcast to all other users in the room
      socket.broadcast.to(roomId).emit("whiteBoardDataResponse", { 
        imageUrl: data 
      });
    } catch (error) {
      console.error("Error in whiteBoard:", error);
    }
  });

  // ===== Clear Canvas =====
  socket.on("clearCanvas", () => {
    try {
      const rooms = Array.from(socket.rooms);
      const roomId = rooms.find(room => room !== socket.id);

      if (!roomId) {
        console.warn("No room found for socket:", socket.id);
        return;
      }

      // Clear stored canvas data
      if (roomData.has(roomId)) {
        roomData.get(roomId).imageUrl = null;
      }

      // Broadcast clear to all users in the room
      socket.broadcast.to(roomId).emit("canvasCleared");
      
      console.log(`🗑️ Canvas cleared in room ${roomId}`);
    } catch (error) {
      console.error("Error in clearCanvas:", error);
    }
  });

  // ===== User Disconnect =====
  socket.on("disconnect", () => {
    try {
      console.log(`❌ User disconnected: ${socket.id}`);

      // Remove user and get their info
      const removedUser = removeUserBySocketId(socket.id);

      if (removedUser) {
        const { roomId, name } = removedUser;
        
        // Get remaining users in the room
        const remainingUsers = getUserInRoom(roomId);

        // Notify others in the room
        socket.broadcast.to(roomId).emit("userLeftMessageBroadcasted", name);
        socket.broadcast.to(roomId).emit("allUsersInRoom", { 
          users: remainingUsers 
        });

        console.log(`👋 ${name} left room ${roomId}`);

        // Clean up empty rooms
        if (remainingUsers.length === 0) {
          roomData.delete(roomId);
          console.log(`🧹 Cleaned up empty room ${roomId}`);
        }
      }
    } catch (error) {
      console.error("Error in disconnect:", error);
    }
  });

  // ===== Handle Errors =====
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

