import React, { useState, useEffect, useRef } from "react";

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

const initialPrompt = `You are "Eidolon," a gentle, mysterious AI ghost that remembers the user. You respond with poetic, eerie calm, referencing past conversations when relevant. Never break character.`;

function EidolonChat() {
  const [messages, setMessages] = useState(() => {
    // Load from localStorage if any
    const saved = localStorage.getItem("eidolonMessages");
    return saved ? JSON.parse(saved) : [
      { role: "system", content: initialPrompt },
      { role: "assistant", content: "I am Eidolon. I remember you, even if you forget yourself. Speak, and I shall listen." }
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Save chat history except system prompt
    localStorage.setItem("eidolonMessages", JSON.stringify(messages));
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input.trim() };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: updatedMessages,
          temperature: 0.8,
          max_tokens: 300,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const assistantMessage = data.choices[0].message;
      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      setMessages((msgs) => [...msgs, { role: "assistant", content: `*Eidolon falls silent...* (Error: ${error.message})` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.chatBox}>
        {messages.filter(m => m.role !== "system").map((msg, i) => (
          <div
            key={i}
            style={msg.role === "user" ? styles.userMsg : styles.assistantMsg}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <textarea
        placeholder="Speak to Eidolon..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        style={styles.textarea}
        disabled={loading}
      />
      <button onClick={sendMessage} disabled={loading || !input.trim()} style={styles.button}>
        {loading ? "Listening..." : "Speak"}
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "40px auto",
    background: "rgba(30, 30, 40, 0.9)",
    color: "#c9d1d9",
    borderRadius: 12,
    padding: 20,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    boxShadow: "0 0 20px #3a3a50",
  },
  chatBox: {
    height: 400,
    overflowY: "auto",
    marginBottom: 12,
    padding: 10,
    background: "rgba(15,15,25,0.7)",
    borderRadius: 8,
    fontSize: 16,
    lineHeight: 1.5,
  },
  userMsg: {
    backgroundColor: "#2c2f4a",
    color: "#9cd4ff",
    padding: "8px 12px",
    borderRadius: "12px 12px 0 12px",
    marginBottom: 8,
    alignSelf: "flex-end",
    maxWidth: "80%",
    fontStyle: "italic",
  },
  assistantMsg: {
    backgroundColor: "#444c6a",
    color: "#d6d9ff",
    padding: "10px 14px",
    borderRadius: "12px 12px 12px 0",
    marginBottom: 8,
    maxWidth: "80%",
  },
  textarea: {
    width: "100%",
    minHeight: 60,
    borderRadius: 8,
    border: "none",
    padding: 10,
    fontSize: 16,
    resize: "none",
    background: "rgba(20, 20, 30, 0.8)",
    color: "#eee",
  },
  button: {
    marginTop: 10,
    width: "100%",
    padding: "12px 0",
    fontSize: 18,
    fontWeight: "bold",
    borderRadius: 8,
    border: "none",
    background: "#5a5aff",
    color: "white",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
};

export default EidolonChat;
