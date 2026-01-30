import { useEffect, useLayoutEffect, useState, useRef } from "react";
import rough from "roughjs";

const roughGenerator = rough.generator();

function WhiteBoard({
  canvasRef,
  ctxRef,
  element,
  setElement,
  tool,
  color,
  user,
  socket,
}) {
  const [img, setImg] = useState(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Listen for whiteboard updates from other users
  useEffect(() => {
    if (!socket) return;

    const handleWhiteBoardData = (data) => {
      setImg(data.imageUrl);
    };

    socket.on("whiteBoardDataResponse", handleWhiteBoardData);

    return () => {
      socket.off("whiteBoardDataResponse", handleWhiteBoardData);
    };
  }, [socket]);

  // If user is not presenter, show the shared image
  if (!user?.presenter) {
    return (
      <div className="w-full h-full flex items-center justify-center border-2 border-gray-800 rounded-lg overflow-hidden bg-white shadow-inner">
        {img ? (
          <img
            src={img}
            alt="Real time whiteBoard Image shared by presenter"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 p-8">
            <svg
              className="w-16 h-16 mb-4 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <p className="text-center">
              Waiting for presenter to share whiteboard...
            </p>
          </div>
        )}
      </div>
    );
  }

  // Initialize canvas with proper responsive dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const setupCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set actual size in memory (scaled for high DPI displays)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Set display size (CSS pixels)
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Scale context to match high DPI
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = color || "black";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctxRef.current = ctx;

      console.log(`Canvas: ${rect.width}x${rect.height}, DPR: ${dpr}`);
    };

    setupCanvas();

    // Handle resize with debounce
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setupCanvas();
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, [canvasRef, ctxRef, color]);

  // Update stroke color when color changes
  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
    }
  }, [color]);

  // Render elements on canvas
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    const roughCanvas = rough.canvas(canvas);
    const ctx = ctxRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw all elements
    element.forEach((el) => {
      try {
        if (el.type === "rect") {
          roughCanvas.draw(
            roughGenerator.rectangle(
              el.offsetX,
              el.offsetY,
              el.width,
              el.height,
              {
                stroke: el.stroke,
                strokeWidth: 5,
                roughness: 0,
              },
            ),
          );
        } else if (el.type === "pencil") {
          if (el.path && el.path.length > 0) {
            roughCanvas.linearPath(el.path, {
              stroke: el.stroke,
              strokeWidth: 5,
              roughness: 0,
            });
          }
        } else if (el.type === "line") {
          roughCanvas.draw(
            roughGenerator.line(el.offsetX, el.offsetY, el.width, el.height, {
              stroke: el.stroke,
              strokeWidth: 5,
              roughness: 0,
            }),
          );
        }
      } catch (error) {
        console.error("Error drawing element:", error);
      }
    });

    // Emit canvas image to socket
    if (socket) {
      const canvasImage = canvas.toDataURL();
      socket.emit("whiteBoard", canvasImage);
    }
  }, [element, canvasRef, ctxRef, socket]);

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pencil") {
      setElement((prevElement) => [
        ...prevElement,
        {
          type: "pencil",
          offsetX: x,
          offsetY: y,
          path: [[x, y]],
          stroke: color,
        },
      ]);
    } else if (tool === "line") {
      setElement((prevElement) => [
        ...prevElement,
        {
          type: "line",
          offsetX: x,
          offsetY: y,
          width: x,
          height: y,
          stroke: color,
        },
      ]);
    } else if (tool === "rect") {
      setElement((prevElement) => [
        ...prevElement,
        {
          type: "rect",
          offsetX: x,
          offsetY: y,
          width: 0,
          height: 0,
          stroke: color,
        },
      ]);
    }

    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pencil") {
      const lastElement = element[element.length - 1];
      if (lastElement && lastElement.path) {
        const { path } = lastElement;
        const newPath = [...path, [x, y]];

        setElement((prev) =>
          prev.map((ele, index) =>
            index === prev.length - 1 ? { ...ele, path: newPath } : ele,
          ),
        );
      }
    } else if (tool === "line") {
      setElement((prev) =>
        prev.map((ele, index) =>
          index === prev.length - 1 ? { ...ele, width: x, height: y } : ele,
        ),
      );
    } else if (tool === "rect") {
      setElement((prev) =>
        prev.map((ele, index) =>
          index === prev.length - 1
            ? {
                ...ele,
                width: x - ele.offsetX,
                height: y - ele.offsetY,
              }
            : ele,
        ),
      );
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Touch support for mobile
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    handleMouseDown(mouseEvent);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    handleMouseMove(mouseEvent);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full border-2 border-gray-800 rounded-lg overflow-hidden bg-white shadow-lg relative"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="cursor-crosshair touch-none"
        style={{ display: "block" }}
      />
    </div>
  );
}

export default WhiteBoard;
