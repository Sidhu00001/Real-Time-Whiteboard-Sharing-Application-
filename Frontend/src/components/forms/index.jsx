// import React from 'react'
// import CreateRoomForm from './createRoomForm';
// import JoinRoomForm from './joinRoomForm';

// function Forms({uuid,socket,setUser}) {
//   return (
//       <div className="min-h-screen flex items-center justify-center bg-white">
      
//       <div className="flex gap-25">
        
//         {/* Create Room Card */}
//         <div className="w-110 h-96 border-2 border-blue-400 rounded-lg flex flex-col items-center px-3 py-5">

//           <h1 className="text-3xl font-bold text-blue-600 mt-5">
//             Create Room
//           </h1>
//           <CreateRoomForm uuid={uuid} socket={socket} setUser={setUser}/>
//         </div>

//         {/* Join Room Card */}
// <div className="w-110 h-96 border-2 border-blue-400 rounded-lg flex flex-col items-center px-3 py-5">

//           <h1 className="text-3xl font-bold text-blue-600 mt-5">
//             Join Room
//           </h1>
//           <JoinRoomForm  uuid={uuid} socket={socket} setUser={setUser}/>
//         </div>

//       </div>

//     </div>

    
//   )
// }

// export default Forms;
import React from "react";
import CreateRoomForm from "./createRoomForm";
import JoinRoomForm from "./joinRoomForm";

function Forms({ uuid, socket, setUser }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      
      {/* Responsive container */}
      <div className="
        flex
        flex-col
        lg:flex-row
        gap-6
        lg:gap-12
        w-full
        max-w-5xl
      ">
        
        {/* Create Room Card */}
        <div className="
          w-full
          max-w-md
          border-2
          border-blue-400
          rounded-lg
          flex
          flex-col
          items-center
          px-4
          py-6
        ">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">
            Create Room
          </h1>

          <CreateRoomForm uuid={uuid} socket={socket} setUser={setUser} />
        </div>

        {/* Join Room Card */}
        <div className="
          w-full
          max-w-md
          border-2
          border-blue-400
          rounded-lg
          flex
          flex-col
          items-center
          px-4
          py-6
        ">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">
            Join Room
          </h1>

          <JoinRoomForm uuid={uuid} socket={socket} setUser={setUser} />
        </div>

      </div>
    </div>
  );
}

export default Forms;
