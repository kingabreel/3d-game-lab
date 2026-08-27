import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import ChatBubble from "./ChatBubble";
import ChatUI from "./ChatUI";
import MobileControls from "./MobileControls";
import OtherPlayer from "./OtherPlayer";
import NameSelect from "./NameSelect";
import { useMultiplayer } from "./useMultiplayer";

function Mina({ woodRef, bones, chatMessage, playerColor }) {
  const { scene } = useGLTF("/models/wood.glb");

  scene.traverse((object) => {
    if (object.isBone) {
      bones.current[object.name] = object;
    }
  });

  return (
    <>
      <primitive
        ref={woodRef}
        object={scene}
        scale={0.6}
        position={[0, 1.5, 3]}
        rotation={[0, Math.PI, 0]}
      />
      {chatMessage && (
        <ChatBubble
          text={chatMessage.text}
          woodRef={woodRef}
          onComplete={chatMessage.onComplete}
        />
      )}
    </>
  );
}

function Scena() {
  const { scene } = useGLTF("/models/mansion.glb");

  return (
    <primitive
      object={scene}
      position={[0, 4.5, 0]}
    />
  );
}

function CameraFollow({ woodRef, cameraDelta }) {
  const { camera } = useThree();

  const yaw = useRef(0);
  const pitch = useRef(0.2);

  const keys = useRef({});

  useEffect(() => {
    const handleKeyDown = (event) => {
      keys.current[event.key] = true;
    };

    const handleKeyUp = (event) => {
      keys.current[event.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!woodRef.current) return;

    const wood = woodRef.current;

    const rotationSpeed = 2;

    if (keys.current.ArrowLeft) {
      yaw.current += rotationSpeed * delta;
    }

    if (keys.current.ArrowRight) {
      yaw.current -= rotationSpeed * delta;
    }

    if (keys.current.ArrowUp) {
      if (pitch.current < 1.2) {
        pitch.current += rotationSpeed * delta;
      }
    }

    if (keys.current.ArrowDown) {
      if (pitch.current > -0.1) {
        pitch.current -= rotationSpeed * delta;
      }
    }

    if (cameraDelta.current) {
      const deltaX = cameraDelta.current.x;
      const deltaY = cameraDelta.current.y;
      yaw.current -= deltaX * 0.005;
      pitch.current += deltaY * 0.005;
      cameraDelta.current = null;
    }

    pitch.current = THREE.MathUtils.clamp(
      pitch.current,
      -0.8,
      1.2
    );

    wood.rotation.y = Math.PI + yaw.current;

    const distance = 4;

    const x =
      Math.sin(yaw.current) *
      Math.cos(pitch.current) *
      distance;

    const y =
      Math.sin(pitch.current) *
      distance;

    const z =
      Math.cos(yaw.current) *
      Math.cos(pitch.current) *
      distance;

    camera.position.set(
      wood.position.x + x,
      wood.position.y + 1.5 + y,
      wood.position.z + z
    );

    camera.lookAt(
      wood.position.x,
      wood.position.y + 1,
      wood.position.z
    );
  });

  return null;
}

function Movement({ woodRef, bones, joystickInput, onPositionChange }) {
  const keys = useRef({});
  const walkTime = useRef(0);

  useEffect(() => {
    const down = (e) => {
      keys.current[e.key.toLowerCase()] = true;
    };

    const up = (e) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, delta) => {
    if (!woodRef.current) return;

    const wood = woodRef.current;

    const direction = new THREE.Vector3();

    if (keys.current.w) direction.z += 1;
    if (keys.current.s) direction.z -= 1;
    if (keys.current.a) direction.x += 1;
    if (keys.current.d) direction.x -= 1;

    if (joystickInput.current) {
      direction.x -= joystickInput.current.x;
      direction.z -= joystickInput.current.y;
    }

    const moving = direction.length() > 0;

    if (moving) {
      direction.normalize();

      direction.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        wood.rotation.y
      );

      direction.multiplyScalar(3 * delta);

      wood.position.add(direction);

      walkTime.current += delta * 8;

      const swing = Math.sin(walkTime.current);

      if (bones.current.thighL) {
        bones.current.thighL.rotation.x = swing * 0.5 + 9.5;
      }

      if (bones.current.thighR) {
        bones.current.thighR.rotation.x = -swing * 0.5 + 9.5;
      }
    } else {
      if (bones.current.thighL) {
        bones.current.thighL.rotation.x = 3.2;
      }

      if (bones.current.thighR) {
        bones.current.thighR.rotation.x = 3.2;
      }
    }

    onPositionChange?.(wood.position.toArray(), wood.rotation.y);
  });

  return null;
}

function Game({ playerName }) {
  const woodRef = useRef();
  const bones = useRef({});
  const [chatBubble, setChatBubble] = useState(null);
  const joystickInput = useRef({ x: 0, y: 0 });
  const cameraDelta = useRef(null);
  const lastTouchPos = useRef(null);
  const lastSyncRef = useRef(0);

  const {
    playerColor,
    otherPlayers,
    allMessages,
    isConnected,
    sendUpdate,
    sendChatMessage,
  } = useMultiplayer(playerName);

  const handleSendMessage = (text) => {
    sendChatMessage(text);
    setChatBubble({
      text,
      onComplete: () => setChatBubble(null),
    });
  };

  const handleJoystickMove = useCallback((x, y) => {
    joystickInput.current = { x, y };
  }, []);

  const handlePositionChange = useCallback((position, rotation) => {
    const now = Date.now();
    if (now - lastSyncRef.current > 50) {
      lastSyncRef.current = now;
      sendUpdate(position, rotation, chatBubble?.text || null);
    }
  }, [sendUpdate, chatBubble]);

  useEffect(() => {
    const cameraArea = document.getElementById("camera-touch-area");
    if (!cameraArea) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      lastTouchPos.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (!lastTouchPos.current) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTouchPos.current.x;
      const deltaY = touch.clientY - lastTouchPos.current.y;
      lastTouchPos.current = { x: touch.clientX, y: touch.clientY };
      cameraDelta.current = { x: deltaX, y: deltaY };
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      lastTouchPos.current = null;
      cameraDelta.current = null;
    };

    cameraArea.addEventListener("touchstart", handleTouchStart, { passive: false });
    cameraArea.addEventListener("touchmove", handleTouchMove, { passive: false });
    cameraArea.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      cameraArea.removeEventListener("touchstart", handleTouchStart);
      cameraArea.removeEventListener("touchmove", handleTouchMove);
      cameraArea.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas camera={{ position: [0, 3, 7], fov: 45 }}>
        <ambientLight intensity={1} />

        <directionalLight
          position={[5, 5, 5]}
          intensity={2}
        />

        <Scena />

        <Mina
          woodRef={woodRef}
          bones={bones}
          chatMessage={chatBubble}
          playerColor={playerColor}
        />

        {Object.values(otherPlayers).map((player) => (
          <OtherPlayer key={player.id} player={player} />
        ))}

        <Movement
          woodRef={woodRef}
          bones={bones}
          joystickInput={joystickInput}
          onPositionChange={handlePositionChange}
        />

        <CameraFollow
          woodRef={woodRef}
          cameraDelta={cameraDelta}
        />
      </Canvas>

      <MobileControls onMove={handleJoystickMove} />

      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          padding: "6px 12px",
          borderRadius: "4px",
          background: isConnected ? "rgba(46,204,113,0.8)" : "rgba(231,76,60,0.8)",
          color: "white",
          fontSize: "12px",
          fontFamily: "sans-serif",
          fontWeight: "bold",
        }}
      >
        {isConnected ? `Online - ${Object.keys(otherPlayers).length + 1} players` : "Connecting..."}
      </div>

      <ChatUI
        messages={allMessages}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

function App() {
  const [playerName, setPlayerName] = useState(null);

  if (!playerName) {
    return <NameSelect onSelect={setPlayerName} />;
  }

  return <Game playerName={playerName} />;
}

export default App;
