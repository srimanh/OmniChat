import { useEffect, useRef, useState } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import './index.css';

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const chatId = "room1";
  const messagesEndRef = useRef(null);

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
    if (message.trim() === '') return;

    const userMessage = {
      text: message,
      sender: "User",
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, "chats", chatId, "messages"), userMessage);
    setMessage('');

    // Smart Reply Logic
    const lower = message.toLowerCase();
    let botReply = "";

    if (lower.includes("where") || lower.includes("status")) {
      botReply = "📦 Your order is on the way and will arrive soon!";
    } else if (lower.includes("hello") || lower.includes("hi")) {
      botReply = "👋 Hello! How can I help you today?";
    } else if (lower.includes("thanks") || lower.includes("thank you")) {
      botReply = "😊 You're welcome! Let me know if you need anything else.";
    }

    // Escalation flow
    if (lower.includes("agent") || lower.includes("human")) {
      setTimeout(async () => {
        const botMessage = {
          text: "👨‍💼 Connecting you to a support agent...",
          sender: "OmniBot 🤖",
          timestamp: serverTimestamp()
        };
        await addDoc(collection(db, "chats", chatId, "messages"), botMessage);

        setTimeout(async () => {
          const joined = {
            text: "🧑‍💼 Support Agent has joined the conversation.",
            sender: "Support Agent",
            timestamp: serverTimestamp()
          };
          await addDoc(collection(db, "chats", chatId, "messages"), joined);
        }, 3000);
      }, 1000);
      return;
    }

    if (botReply) {
      setTimeout(async () => {
        const botMessage = {
          text: botReply,
          sender: "OmniBot 🤖",
          timestamp: serverTimestamp()
        };
        await addDoc(collection(db, "chats", chatId, "messages"), botMessage);
      }, 1000);
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