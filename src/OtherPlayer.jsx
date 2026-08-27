import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

function OtherPlayer({ player }) {
  const groupRef = useRef();
  const targetPosition = useRef(player.position);
  const targetRotation = useRef(player.rotation);
  const bubbleRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.x += (player.position[0] - groupRef.current.position.x) * 0.1;
      groupRef.current.position.y += (player.position[1] - groupRef.current.position.y) * 0.1;
      groupRef.current.position.z += (player.position[2] - groupRef.current.position.z) * 0.1;
      groupRef.current.rotation.y += (player.rotation - groupRef.current.rotation.y) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={player.position}>
      <mesh position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
        <meshStandardMaterial color={player.color} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={player.color} />
      </mesh>
      <Html
        position={[0, 1.8, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            color: player.color,
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "11px",
            fontFamily: "sans-serif",
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
        >
          {player.name}
        </div>
      </Html>
      {player.chatBubble && (
        <Html
          position={[0, 2.1, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "white",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "12px",
              fontFamily: "sans-serif",
              color: "#000",
              maxWidth: "150px",
              wordWrap: "break-word",
              textAlign: "center",
            }}
          >
            {player.chatBubble}
          </div>
        </Html>
      )}
    </group>
  );
}

export default OtherPlayer;
