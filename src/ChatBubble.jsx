import { useState, useRef, useEffect } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ChatBubble({ text, woodRef, onComplete }) {
  const [opacity, setOpacity] = useState(1);
  const groupRef = useRef();
  const worldPos = useRef(new THREE.Vector3());

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, 3000);

    const removeTimer = setTimeout(() => {
      onComplete?.();
    }, 3500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  useFrame(() => {
    if (woodRef?.current && groupRef.current) {
      worldPos.current.set(0, 2.3, 0);
      woodRef.current.localToWorld(worldPos.current);
      groupRef.current.position.copy(worldPos.current);
    }
  });

  return (
    <group ref={groupRef}>
      <Html
        center
        distanceFactor={8}
        style={{
          opacity,
          transition: "opacity 0.5s ease-out",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontFamily: "sans-serif",
            color: "#000",
            maxWidth: "150px",
            wordWrap: "break-word",
            textAlign: "center",
            position: "relative",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          {text}
          <div
            style={{
              position: "absolute",
              bottom: "-6px",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid white",
            }}
          />
        </div>
      </Html>
    </group>
  );
}

export default ChatBubble;
