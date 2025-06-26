import { useEffect, useRef, useState } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import './index.css';

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

    // 2. Escalation flow for agent/human/help (2-step)
    const lower = trimmed.toLowerCase();
    if (lower.includes("agent") || lower.includes("human") || lower.includes("help")) {
      setTimeout(async () => {
        await addDoc(collection(db, "chats", chatId, "messages"), {
          text: "👨‍💼 Connecting you to a support agent...",
          sender: "OmniBot 🤖",
          timestamp: serverTimestamp(),
        });
        setTimeout(async () => {
          await addDoc(collection(db, "chats", chatId, "messages"), {
            text: "🧑‍💼 Support Agent has joined the conversation.",
            sender: "Support Agent",
            timestamp: serverTimestamp(),
          });
        }, 3000); // simulate agent connection
      }, 800); // initial bot delay
      return;
    }

    // 3. Trigger smart reply if applicable (for "where"/"status")
    const botReply = triggerSmartReply(trimmed);
    if (botReply) {
      setTimeout(async () => {
        await addDoc(collection(db, "chats", chatId, "messages"), {
          text: botReply,
          sender: "OmniBot 🤖",
          timestamp: serverTimestamp(),
        });
      }, 800); // simulate typing delay
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
                }`}
              >
                <div className="chat-meta">
                  <span className="chat-meta-sender">
                    {msg.sender === "User"
                      ? "You"
                      : msg.sender}
                  </span>
                  <span className="chat-meta-time">
                    {msg.timestamp?.toDate
                      ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ""}
                  </span>
                </div>
                <div>{msg.text}</div>
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