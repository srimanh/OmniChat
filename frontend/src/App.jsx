import { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const chatId = "room1"; // static room for now

  useEffect(() => {
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (message.trim() === '') return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: message,
      sender: "sriman",
      timestamp: serverTimestamp()
    });
    setMessage('');
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>OmniChat 💬</h2>
      <div style={{ border: "1px solid #ccc", padding: "10px", height: "300px", overflowY: "auto" }}>
        {messages.map(msg => (
          <p key={msg.id}><strong>{msg.sender}:</strong> {msg.text}</p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type a message..."
        style={{ width: "80%", padding: "10px" }}
      />
      <button onClick={sendMessage} style={{ padding: "10px" }}>Send</button>
    </div>
  );
}

export default App;
