import { useState, useRef, useEffect } from "react";

function ChatUI({ onSendMessage, messages }) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isFocused && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [isFocused, messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
      inputRef.current?.blur();
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: isFocused ? "50vh" : "180px",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "auto",
        transition: "height 0.3s ease",
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          paddingBottom: 0,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              color: "white",
              fontSize: "14px",
              fontFamily: "sans-serif",
              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
              wordWrap: "break-word",
            }}
          >
            <span style={{ color: msg.color || "#7dd3fc", fontWeight: "bold" }}>
              {msg.user}:
            </span>{" "}
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          padding: "10px",
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "auto",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={() => setIsFocused(false)}
          placeholder="Type a message..."
          maxLength={100}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #555",
            background: "#1a1a2e",
            color: "white",
            fontSize: "16px",
            fontFamily: "sans-serif",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "12px 20px",
            borderRadius: "4px",
            border: "none",
            background: "#3b82f6",
            color: "white",
            fontSize: "16px",
            fontFamily: "sans-serif",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatUI;
