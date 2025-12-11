import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isUsernameSet) {
      const newSocket = io('http://localhost:3001');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        newSocket.emit('user_joined', username);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('chat_message', (data) => {
        setMessages(prev => [...prev, {
          type: 'message',
          ...data
        }]);
      });

      newSocket.on('user_joined', (data) => {
        setMessages(prev => [...prev, {
          type: 'notification',
          text: `${data.username} joined the chat`,
          timestamp: data.timestamp
        }]);
      });

      newSocket.on('user_left', (data) => {
        setMessages(prev => [...prev, {
          type: 'notification',
          text: `${data.username} left the chat`,
          timestamp: data.timestamp
        }]);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [isUsernameSet, username]);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('chat_username', username);
      setIsUsernameSet(true);
    }
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && inputMessage.length <= 500) {
      socket.emit('chat_message', {
        username: username,
        message: inputMessage
      });
      setInputMessage('');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  useEffect(() => {
    const savedUsername = localStorage.getItem('chat_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setIsUsernameSet(true);
    }
  }, []);

  if (!isUsernameSet) {
    return (
      <div className="app">
        <div className="username-container">
          <h1>Welcome to Chat App</h1>
          <form onSubmit={handleUsernameSubmit}>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength="20"
              className="username-input"
            />
            <button type="submit" className="btn-primary">
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <h2>Chat Room</h2>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="messages-container">
          {messages.map((msg, index) => (
            msg.type === 'notification' ? (
              <div key={index} className="notification">
                {msg.text}
              </div>
            ) : (
              <div 
                key={msg.id || index} 
                className={`message ${msg.username === username ? 'own-message' : ''}`}
              >
                <div className="message-header">
                  <span className="message-username">{msg.username}</span>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            )
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleMessageSubmit} className="message-input-container">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            maxLength="500"
            className="message-input"
            disabled={!isConnected}
          />
          <button 
            type="submit" 
            className="btn-send"
            disabled={!isConnected || !inputMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
