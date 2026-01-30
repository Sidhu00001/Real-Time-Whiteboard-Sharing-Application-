const users = [];

/**
 * Add a user to the users array
 * @param {Object} userData - User data containing name, userId, roomId, host, presenter, socketId
 * @returns {Array} - All users in the same room
 */
export const addUser = ({ name, userId, roomId, host, presenter, socketId }) => {
  // Check if user already exists in this room
  const existingUserIndex = users.findIndex(
    (u) => u.userId === userId && u.roomId === roomId
  );

  if (existingUserIndex !== -1) {
    // Update existing user's socketId (in case they reconnected)
    users[existingUserIndex].socketId = socketId;
  } else {
    // Add new user
    users.push({
      name,
      userId,
      roomId,
      host,
      presenter,
      socketId,
      joinedAt: new Date().toISOString()
    });
  }

  // Return all users in this room
  return getUserInRoom(roomId);
};

/**
 * Remove a user by their socket ID
 * @param {string} socketId - Socket ID of the user to remove
 * @returns {Object|undefined} - The removed user object, or undefined if not found
 */
export const removeUserBySocketId = (socketId) => {
  const index = users.findIndex((u) => u.socketId === socketId);

  if (index !== -1) {
    const removedUser = users.splice(index, 1)[0];
    console.log(`🗑️ Removed user: ${removedUser.name} (${removedUser.userId})`);
    return removedUser;
  }

  return undefined;
};

/**
 * Get a user by their user ID
 * @param {string} userId - User ID to search for
 * @returns {Object|undefined} - User object or undefined
 */
export const getUser = (userId) => {
  return users.find((u) => u.userId === userId);
};

/**
 * Get all users in a specific room
 * @param {string} roomId - Room ID to search for
 * @returns {Array} - Array of users in the room
 */
export const getUserInRoom = (roomId) => {
  return users.filter((u) => u.roomId === roomId);
};

/**
 * Get all users (for debugging)
 * @returns {Array} - All users
 */
export const getAllUsers = () => {
  return users;
};

/**
 * Remove all users from a specific room
 * @param {string} roomId - Room ID to clear
 * @returns {number} - Number of users removed
 */
export const clearRoom = (roomId) => {
  const usersInRoom = getUserInRoom(roomId);
  const count = usersInRoom.length;
  
  usersInRoom.forEach(user => {
    const index = users.findIndex(u => u.socketId === user.socketId);
    if (index !== -1) {
      users.splice(index, 1);
    }
  });
  
  return count;
};