import { useState } from "react";

function NameSelect({ onSelect }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSelect(name.trim());
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        fontFamily: "sans-serif",
      }}
    >
      <h1
        style={{
          color: "white",
          marginBottom: "10px",
          fontSize: "32px",
          textShadow: "0 2px 10px rgba(0,0,0,0.5)",
        }}
      >
        Metaverso
      </h1>
      <p
        style={{
          color: "#aaa",
          marginBottom: "30px",
          fontSize: "14px",
        }}
      >
        Enter your name to join
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={15}
          autoFocus
          style={{
            padding: "15px 20px",
            fontSize: "18px",
            borderRadius: "8px",
            border: "2px solid #3b82f6",
            background: "rgba(255,255,255,0.1)",
            color: "white",
            width: "250px",
            textAlign: "center",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={!name.trim()}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            borderRadius: "8px",
            border: "none",
            background: name.trim() ? "#3b82f6" : "#555",
            color: "white",
            cursor: name.trim() ? "pointer" : "not-allowed",
            transition: "background 0.2s",
          }}
        >
          Join Game
        </button>
      </form>
    </div>
  );
}

export default NameSelect;
