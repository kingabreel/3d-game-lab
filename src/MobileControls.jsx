import { useRef, useState } from "react";

function MobileControls({ onMove }) {
  const joystickRef = useRef(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickCenter = useRef({ x: 0, y: 0 });

  const handleJoystickStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    joystickCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setJoystickActive(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const updateJoystick = (clientX, clientY) => {
    const maxDistance = 40;
    let dx = clientX - joystickCenter.current.x;
    let dy = clientY - joystickCenter.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }

    setJoystickPos({ x: dx, y: dy });

    const normalizedX = dx / maxDistance;
    const normalizedY = dy / maxDistance;
    onMove(normalizedX, normalizedY);
  };

  const handleJoystickMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!joystickActive) return;
    const touch = e.touches[0];
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleJoystickEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "20px",
          bottom: "220px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.15)",
          border: "2px solid rgba(255, 255, 255, 0.3)",
          touchAction: "none",
          zIndex: 10,
        }}
        ref={joystickRef}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.5)",
            transition: joystickActive ? "none" : "transform 0.1s ease-out",
          }}
        />
      </div>

      <div
        id="camera-touch-area"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "50%",
          height: "100%",
          touchAction: "none",
          zIndex: 5,
        }}
      />
    </>
  );
}

export default MobileControls;
