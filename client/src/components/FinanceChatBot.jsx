import React, { useEffect, useRef, useState } from "react";
import "./FinanceChatBot.css";

const BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://finance-tracker-app-ihdp.onrender.com/api");


export default function FinanceChatBot({ apiEndpoint: propEndpoint }) {
  // Use passed prop OR default to BASE_URL/chatbot/chat
  const apiEndpoint = propEndpoint || `${BASE_URL}/chatbot/chat`;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("finance-chat-messages");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: Date.now(),
            role: "assistant",
            text: "Hi! I'm your Finance Assistant. Ask me about your expenses, income, budgets, or reports!",
          },
        ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom and save messages to localStorage
  useEffect(() => {
    localStorage.setItem("finance-chat-messages", JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Append message helper
  const appendMessage = (msg) =>
    setMessages((prev) => [...prev, { ...msg, id: Date.now() }]);

  // Send message to backend
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    appendMessage(userMsg);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      appendMessage({
        role: "assistant",
        text: data.response || data.reply || "(no reply)",
      });
    } catch (err) {
      appendMessage({
        role: "assistant",
        text: "Sorry, I couldn't reach the finance assistant. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear chat
  const handleClear = () => {
    localStorage.removeItem("finance-chat-messages");
    setMessages([]);
  };

  return (
    <div className="chatbot-container">
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="chatbot-button"
          title="Open Finance Chat"
        >
          💰
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <button onClick={handleClear} className="chatbot-clear" title="Clear Chat">
              🗑️
            </button>
            <div className="chatbot-title">Finance Assistant</div>
            <button onClick={() => setOpen(false)} className="chatbot-close">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`message-row ${m.role === "user" ? "user" : "assistant"}`}
              >
                <div className={`message-bubble ${m.role}`}>{m.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Ask about expenses, income, budgets..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend} disabled={loading}>
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

