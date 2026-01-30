import { useRef, useState, useEffect } from "react";
import WhiteBoard from "../../components/whiteboard";

const RoomPage = ({ user, socket, users }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [element, setElement] = useState([]);
  const [history, setHistory] = useState([]);
  const [operUserTab, setOperUserTab] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(users || []);

  // ===== Socket Event Listeners =====
  useEffect(() => {
    if (!socket) return;

    const handleAllUsers = ({ users }) => {
      setOnlineUsers(users);
    };

    const handleCanvasCleared = () => {
      if (!canvasRef.current || !ctxRef.current) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      ctxRef.current.clearRect(0, 0, rect.width, rect.height);
      setElement([]);
      setHistory([]);
    };

    socket.on("allUsersInRoom", handleAllUsers);
    socket.on("canvasCleared", handleCanvasCleared);

    return () => {
      socket.off("allUsersInRoom", handleAllUsers);
      socket.off("canvasCleared", handleCanvasCleared);
    };
  }, [socket]);

  useEffect(() => {
    if (users) {
      setOnlineUsers(users);
    }
  }, [users]);

  // ===== Undo =====
  const handleUndo = () => {
    if (element.length === 0) return;
    const last = element[element.length - 1];
    setHistory((prev) => [...prev, last]);
    setElement((prev) => prev.slice(0, -1));
  };

  // ===== Redo =====
  const handleRedo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setElement((prev) => [...prev, last]);
    setHistory((prev) => prev.slice(0, -1));
  };

  // ===== Clear Canvas =====
  const handleClear = () => {
    if (!canvasRef.current || !ctxRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    ctxRef.current.clearRect(0, 0, rect.width, rect.height);
    setElement([]);
    setHistory([]);

    if (socket) {
      socket.emit("clearCanvas");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-linear-to-br from-gray-50 to-gray-100">
      {/* ===== Users Button (Top Left) ===== */}
      <button
        onClick={() => setOperUserTab(true)}
        className="fixed top-4 left-4 z-40 bg-linear-to-r from-gray-900 to-gray-800 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold text-sm md:text-base"
      >
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="hidden sm:inline">Users</span>
          <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">
            {onlineUsers?.length || 0}
          </span>
        </span>
      </button>

      {/* ===== Users Drawer ===== */}
      {operUserTab && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
            onClick={() => setOperUserTab(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 left-0 h-full w-80 md:w-96 bg-linear-to-b from-gray-900 to-gray-800 z-50 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Online Users
                </h2>
                <button
                  onClick={() => setOperUserTab(false)}
                  className="text-gray-400 hover:text-white transition-colors text-3xl hover:rotate-90 transform duration-200"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-400">
                {onlineUsers?.length || 0} {onlineUsers?.length === 1 ? 'user' : 'users'} connected
              </p>
            </div>

            {/* Users List */}
            <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto custom-scrollbar">
              {onlineUsers && onlineUsers.length > 0 ? (
                onlineUsers.map((u, index) => {
                  const isYou = user && u && u.userId === user.userId;
                  const isHost = u && u.host === true;
                  const isPresenter = u && u.presenter === true;

                  return (
                    <div
                      key={u?.userId || index}
                      className={`p-4 rounded-xl text-sm transition-all hover:scale-[1.02] ${
                        isHost
                          ? "bg-linear-to-r from-yellow-500 to-orange-500 text-black font-semibold shadow-lg"
                          : "bg-gray-700 bg-opacity-50 text-white backdrop-blur-sm border border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full ${
                            isHost 
                              ? 'bg-linear-to-br from-yellow-300 to-orange-400'
                              : 'bg-linear-to-br from-blue-400 to-purple-600'
                          } flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                            {u?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="font-semibold text-base">
                              {u?.name || `User ${index + 1}`}
                              {isYou && (
                                <span className="text-xs opacity-75 ml-2 bg-black bg-opacity-20 px-2 py-0.5 rounded">(You)</span>
                              )}
                            </div>
                            {isPresenter && (
                              <div className="text-xs opacity-90 flex items-center gap-1 mt-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                </svg>
                                Presenter
                              </div>
                            )}
                          </div>
                        </div>

                        {isHost && (
                          <span className="text-xs bg-black text-yellow-300 px-3 py-1 rounded-lg font-bold shadow-md">
                            👑 Host
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No users online</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== Heading ===== */}
      <div className="text-center py-4 md:py-6 shrink-0 bg-white shadow-md">
        <h1 className="text-2xl md:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          White Board Sharing App
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          <span className="font-semibold text-blue-600">{onlineUsers?.length || 0}</span> users online
        </p>
      </div>

      {/* ===== Toolbar (Presenter Only) ===== */}
      {user?.presenter && (
        <div className="w-full px-4 md:px-10 flex flex-wrap justify-center items-center gap-3 md:gap-4 py-3 md:py-4 shrink-0 bg-white shadow-md border-t border-gray-200">
          {/* Tools */}
          <div className="flex gap-3 md:gap-6 items-center bg-gray-100 px-4 py-2 rounded-lg">
            {["pencil", "line", "rect"].map((t) => (
              <label
                key={t}
                className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
              >
                <input
                  type="radio"
                  name="tool"
                  value={t}
                  checked={tool === t}
                  onChange={(e) => setTool(e.target.value)}
                  className="cursor-pointer w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-sm md:text-base">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </label>
            ))}
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
            <span className="font-medium text-sm md:text-base">Color:</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="cursor-pointer w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-blue-500 transition"
            />
          </div>

          {/* Undo / Redo */}
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={element.length === 0}
              className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 hover:scale-105 transition-all font-medium text-sm md:text-base shadow-md"
              title="Undo"
            >
              <span className="hidden sm:inline">↶ Undo</span>
              <span className="sm:hidden">↶</span>
            </button>

            <button
              onClick={handleRedo}
              disabled={history.length === 0}
              className="px-3 md:px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:scale-105 transition-all font-medium text-sm md:text-base"
              title="Redo"
            >
              <span className="hidden sm:inline">↷ Redo</span>
              <span className="sm:hidden">↷</span>
            </button>
          </div>

          {/* Clear Canvas */}
          <button
            onClick={handleClear}
            className="px-3 md:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:scale-105 transition-all font-medium text-sm md:text-base shadow-md"
          >
            <span className="hidden sm:inline">🗑️ Clear Canvas</span>
            <span className="sm:hidden">🗑️</span>
          </button>
        </div>
      )}

      {/* ===== Whiteboard (Fills remaining space) ===== */}
      <div className="flex-1 w-full p-2 md:p-4 overflow-hidden">
        <WhiteBoard
          canvasRef={canvasRef}
          ctxRef={ctxRef}
          element={element}
          setElement={setElement}
          color={color}
          tool={tool}
          user={user}
          socket={socket}
        />
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default RoomPage;