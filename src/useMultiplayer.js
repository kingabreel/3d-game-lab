import { useEffect, useRef, useState, useCallback } from "react";

function generateColor() {
  const colors = [
    "#e74c3c", "#3498db", "#2ecc71", "#f39c12",
    "#9b59b6", "#1abc9c", "#e67e22", "#34495e"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function useMultiplayer(playerName) {
  const [playerId, setPlayerId] = useState(null);
  const [playerColor] = useState(() => generateColor());
  const [otherPlayers, setOtherPlayers] = useState({});
  const [allMessages, setAllMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef(null);
  const localStateRef = useRef({
    position: [0, 1.5, 3],
    rotation: Math.PI,
    chatBubble: null,
  });
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const isDev = import.meta.env.DEV;
    const wsUrl = isDev ? `${protocol}//${host}/ws` : `${protocol}//${host}`;

    console.log("[Multiplayer] Connecting to:", wsUrl);

    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[Multiplayer] Connected!");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[Multiplayer] Received:", data.type);

          if (data.type === "init") {
            console.log("[Multiplayer] Got player ID:", data.playerId);
            setPlayerId(data.playerId);
            ws.send(JSON.stringify({
              type: "player_join",
              playerName,
              playerColor,
              position: localStateRef.current.position,
              rotation: localStateRef.current.rotation,
            }));
          }

          if (data.type === "player_join") {
            console.log("[Multiplayer] Player joined:", data.playerName);
            setOtherPlayers((prev) => ({
              ...prev,
              [data.playerId]: {
                id: data.playerId,
                name: data.playerName,
                color: data.playerColor,
                position: data.position,
                rotation: data.rotation,
                chatBubble: null,
                lastSeen: Date.now(),
              },
            }));
          }

          if (data.type === "heartbeat" || data.type === "player_update") {
            setOtherPlayers((prev) => ({
              ...prev,
              [data.playerId]: {
                ...prev[data.playerId],
                id: data.playerId,
                name: data.playerName,
                color: data.playerColor,
                position: data.position,
                rotation: data.rotation,
                chatBubble: data.chatBubble,
                lastSeen: Date.now(),
              },
            }));
          }

          if (data.type === "chat_message") {
            console.log("[Multiplayer] Chat:", data.text);
            setAllMessages((prev) => [...prev.slice(-49), {
              user: data.playerName,
              text: data.text,
              color: data.playerColor,
            }]);
          }

          if (data.type === "player_leave") {
            console.log("[Multiplayer] Player left:", data.playerName);
            setOtherPlayers((prev) => {
              const updated = { ...prev };
              delete updated[data.playerId];
              return updated;
            });
          }
        } catch (e) {
          console.error("[Multiplayer] Error parsing message:", e);
        }
      };

      ws.onclose = () => {
        console.log("[Multiplayer] Disconnected");
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (e) => {
        console.error("[Multiplayer] WebSocket error:", e);
      };
    }

    connect();

    const heartbeatInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "heartbeat",
          playerName,
          playerColor,
          position: localStateRef.current.position,
          rotation: localStateRef.current.rotation,
          chatBubble: localStateRef.current.chatBubble,
        }));
      }
    }, 2000);

    return () => {
      clearInterval(heartbeatInterval);
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [playerName, playerColor]);

  const sendUpdate = useCallback((position, rotation, chatBubble) => {
    localStateRef.current = { position, rotation, chatBubble };
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "player_update",
        playerName,
        playerColor,
        position,
        rotation,
        chatBubble,
      }));
    }
  }, [playerName, playerColor]);

  const sendChatMessage = useCallback((text) => {
    console.log("[Multiplayer] Sending chat:", text);
    const message = { user: playerName, text, color: playerColor };
    setAllMessages((prev) => [...prev.slice(-49), message]);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "chat_message",
        playerName,
        playerColor,
        text,
      }));
    }
  }, [playerName, playerColor]);

  return {
    playerId,
    playerColor,
    otherPlayers,
    allMessages,
    isConnected,
    sendUpdate,
    sendChatMessage,
  };
}

export { generateColor };
