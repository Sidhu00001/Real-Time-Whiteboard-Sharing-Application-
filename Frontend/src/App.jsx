import { Route, Routes } from "react-router-dom";
import { io } from "socket.io-client";
import Forms from "./components/forms";
import RoomPage from "./pages/roomPage";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const server = "http://localhost:8000";
const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  transports: ["websocket"],
};

const socket = io(server, connectionOptions);

const App = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // User successfully joined
    const handleUserIsJoined = (data) => {
      if (data.success) {
        console.log("userJoined");
        setUsers(data.users);
      } else {
        console.log("userJoined error");
      }
    };

    // All users in room updated
    const handleAllUsersInRoom = (data) => {
      setUsers(data.users);
    };

    // Someone joined (broadcasted to others)
    const handleUserJoinedMessage = (name) => {
      console.log(`${name} joined`);
      toast.info(`${name} joined the room`);
    };

    // Someone left (broadcasted to others)
    const handleUserLeftMessage = (name) => {
      console.log(`${name} left`);
      toast.warning(`${name} left the room`);
    };

    // Register socket listeners
    socket.on("userIsJoined", handleUserIsJoined);
    socket.on("allUsersInRoom", handleAllUsersInRoom);
    socket.on("userJoinedMessageBroadcasted", handleUserJoinedMessage);
    socket.on("userLeftMessageBroadcasted", handleUserLeftMessage);

    // Cleanup: Remove listeners when component unmounts
    return () => {
      socket.off("userIsJoined", handleUserIsJoined);
      socket.off("allUsersInRoom", handleAllUsersInRoom);
      socket.off("userJoinedMessageBroadcasted", handleUserJoinedMessage);
      socket.off("userLeftMessageBroadcasted", handleUserLeftMessage);
    };
  }, []); // Empty dependency array - run once on mount

  const uuid = () => {
    const S4 = () => {
      return (((1 + Math.random()) * 0x10000) | 0)
        .toString(16)
        .substring(1);
    };

    return (
      S4() +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      S4() +
      S4()
    );
  };

  return (
    <div className="container">
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route
          path="/"
          element={<Forms uuid={uuid} socket={socket} setUser={setUser} />}
        />
        <Route
          path="/:roomId"
          element={<RoomPage user={user} socket={socket} users={users} />}
        />
      </Routes>
    </div>
  );
};

export default App;

