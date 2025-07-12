import { useEffect, useRef, useState } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import './index.css';
import ReactMarkdown from 'react-markdown';

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const chatId = "room1";
  const messagesEndRef = useRef(null);

  // Smart reply logic as a helper function
  const triggerSmartReply = (msg) => {
    const txt = msg.toLowerCase();
    if (txt.includes("where") || txt.includes("status")) {
      return "📦 Your order is currently being processed and will be shipped soon!";
    }
    // Don't return escalation here, handle below for 2-step agent flow
    return null;
  };

  useEffect(() => {
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
  const chatEnd = document.getElementById("chat-end");
  chatEnd?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

const sendMessage = async () => {
  const trimmed = message.trim();
  if (!trimmed) return;

  // 1. Add user message
  await addDoc(collection(db, "chats", chatId, "messages"), {
    text: trimmed,
    sender: "User",
    timestamp: serverTimestamp(),
  });

  setMessage(""); // Clear input

  // 2. Show "Typing..." loader
  setMessages((prev) => [
    ...prev,
    { id: "typing", text: "Typing...", sender: "bot", temp: true }
  ]);

  // 3. Call backend for bot reply
  try {
    const res = await fetch("http://localhost:5050/chatbot/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed }),
    });
    const data = await res.json();

    // 4. Remove "Typing..." and add real bot reply
    setMessages((prev) => prev.filter((msg) => !msg.temp));
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: data.reply,
      sender: "bot",
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    setMessages((prev) => prev.filter((msg) => !msg.temp));
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: "Sorry, I couldn't get a reply from the AI.",
      sender: "bot",
      timestamp: serverTimestamp(),
    });
  }
};

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="chat-bg">
      <div className="chat-container">
        <h2 className="chat-title">OmniChat <span role="img" aria-label="chat">💬</span></h2>
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`chat-bubble-row ${
                msg.sender === "User"
                  ? "chat-bubble-row-user"
                  : msg.sender === "Support Agent"
                  ? "chat-bubble-row-agent"
                  : "chat-bubble-row-bot"
              }`}
            >
              <div
                className={`chat-bubble ${
                  msg.sender === "User"
                    ? "chat-bubble-user"
                    : msg.sender === "Support Agent"
                    ? "chat-bubble-agent"
                    : "chat-bubble-bot"
                } message ${msg.sender === "OmniBot 🤖" ? "bot" : ""}`}
              >
                <div className="chat-meta">
                  <span className="chat-meta-sender">
                    {msg.sender === "User" ? "You" : msg.sender}
                  </span>
                  <span className="chat-meta-time">
                    {msg.timestamp?.toDate
                      ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                      : ""}
                  </span>
                </div>
                <div className={`chat-bubble ${msg.sender === "bot" ? "bot-bubble" : ""}`}>
                  {msg.sender === "bot"
                    ? <ReactMarkdown>{msg.text}</ReactMarkdown>
                    : msg.text}
                </div>
                <p className="timestamp">
                  {msg.timestamp?.toDate
                    ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-row">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="chat-input"
          />
          <button
            onClick={sendMessage}
            className="chat-send-btn"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;