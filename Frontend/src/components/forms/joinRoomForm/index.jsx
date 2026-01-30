import { useState } from "react"
import { useNavigate } from "react-router-dom";

function JoinRoomForm({uuid,socket,setUser}) {
  const [roomId,setRoomId]=useState("");
  const [name,setName]=useState("");
  const navigate=useNavigate();
  const handleRoomJoin=(e)=>{
e.preventDefault();
const roomData={
name,
  roomId,
  userId:uuid(),
  host:false,
  presenter:false
};
setUser(roomData);
console.log(roomData);
 navigate(`/${roomId}`);
 socket.emit("userJoined",roomData);
  
  }
  return (
  <form className="w-full mt-18 flex flex-col gap-4">
      
      {/* Name input */}
      <input
        type="text"
        placeholder="Enter your name"
        onChange={(e)=>setName(e.target.value)}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
          <input
        type="text"
        placeholder="Enter Room Code"
         onChange={(e)=>setRoomId(e.target.value)}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

     

      {/* Submit button */}
      <button
        type="submit"
        onClick={handleRoomJoin}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700"
      >
        Join Room
      </button>

    </form>
  )
}

export default JoinRoomForm