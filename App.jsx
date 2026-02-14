import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { v4 as uuidv4 } from 'uuid';

const App = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const activeSession = sessions.find(
    (session) => session.id === activeSessionId
  );

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.messages]);

  const handleNewChat = () => {
    const newSession = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage({
        mimeType: file.type,
        data: reader.result.split(',')[1],
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (text = inputText) => {
    if (!text.trim() || !activeSessionId) return;

    setIsLoading(true);

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: text,
      image,
    };

    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? { ...session, messages: [...session.messages, userMessage] }
          : session
      )
    );

    setInputText('');
    setImage(null);

    try {
      // 🔹 Replace this with your Gemini API call logic
      const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'AI response will appear here.',
      };

      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, aiMessage] }
            : session
        )
      );
    } catch (error) {
      const errorMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Something went wrong.',
      };

      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, errorMessage] }
            : session
        )
      );
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
      />

      <ChatWindow
        session={activeSession}
        inputText={inputText}
        setInputText={setInputText}
        onSendMessage={handleSendMessage}
        onKeyDown={handleKeyDown}
        isLoading={isLoading}
        image={image}
        setImage={setImage}
        fileInputRef={fileInputRef}
        textareaRef={textareaRef}
        messagesEndRef={messagesEndRef}
        onFileChange={handleFileChange}
      />
    </div>
  );
};

export default App;
