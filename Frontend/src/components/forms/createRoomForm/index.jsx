import { useState } from "react";
import { useNavigate } from "react-router-dom";
function CreateRoomForm({ uuid, socket, setUser }) {
  const [roomId, setRoomId] = useState(uuid());
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = (e) => {
    e.preventDefault();

    const roomData = {
      name,
      roomId,
      userId: uuid(),
      host: true,
      presenter: true,
    };

    setUser(roomData);
    socket.emit("userJoined", roomData);
    navigate(`/${roomId}`);
  };

  return (
    <form
      onSubmit={handleCreateRoom}
      className="
        w-full
        flex
        flex-col
        gap-4
        px-2
        sm:px-0
      "
    >
      {/* Name input */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        className="
          w-full
          px-3
          py-2.5
          border
          rounded-md
          text-sm
          sm:text-base
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
        "
        required
      />

      {/* Room code */}
      <input
        type="text"
        value={roomId}
        disabled
        className="
          w-full
          px-3
          py-2.5
          border
          rounded-md
          bg-gray-100
          text-sm
          sm:text-base
        "
      />

      {/* Buttons row (RESPONSIVE) */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => setRoomId(uuid())}
          className="
            w-full
            sm:w-1/2
            px-3
            py-2.5
            text-sm
            bg-blue-600
            text-white
            rounded-md
            hover:bg-blue-700
            transition
          "
        >
          Generate
        </button>

        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(roomId)}
          className="
            w-full
            sm:w-1/2
            px-3
            py-2.5
            text-sm
            border
            border-red-600
            text-red-600
            rounded-md
            hover:bg-red-50
            transition
          "
        >
          Copy
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="
          mt-2
          w-full
          py-3
          text-base
          font-semibold
          bg-green-600
          text-white
          rounded-md
          hover:bg-green-700
          transition
        "
      >
        Generate Room
      </button>
    </form>
  );
}

export default CreateRoomForm;







