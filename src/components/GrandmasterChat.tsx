
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Chess } from 'chess.js';
import './GrandmasterChat.css';

interface Message {
  role: 'user' | 'bot' | 'system';
  text: string;
}

interface GrandmasterChatProps {
  game: Chess;
  onClose?: () => void;
}

export const GrandmasterChat: React.FC<GrandmasterChatProps> = ({ game, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "Hello! I am your Grandmaster Advisor. How can I help you with your game today? I can suggest moves, explain strategies, or clarify rules." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Use lazy initialization to avoid crashing if key is missing
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
          throw new Error("GEMINI_API_KEY is not configured in environment variables.");
      }
      
      const ai = new GoogleGenAI({ apiKey });

      const history = messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n');

      const systemPrompt = `You are a world-class Chess Grandmaster and a friendly, encouraging teacher. 
You are currently observing a chess game.
CURRENT BOARD (FEN): ${game.fen()}
WHOS TURN: ${game.turn() === 'w' ? 'White' : 'Black'}
GAME HISTORY (last 20 moves): ${game.history().slice(-20).join(', ')}

Your task is to answer the user's questions about this specific game or chess in general.
If the user asks for a move, give them strategic advice based on the current position.
Be concise but insightful. Use algebraic notation for moves (e.g., Nf3, e4).
Maintain a helpful and professional "Grandmaster" tone.`;

      const prompt = `Chat History:\n${history}\n\nUser: ${userMessage}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
        }
      });

      const text = response.text || "I'm sorry, I couldn't formulate a response right now.";

      setMessages(prev => [...prev, { role: 'bot', text }]);
    } catch (error) {
      console.error("Grandmaster Chat Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Sorry, I had trouble connecting. Please try again.";
      setMessages(prev => [...prev, { role: 'system', text: errorMessage.includes("API_KEY") ? "Advisor service is currently unavailable. Please configure the Gemini API Key." : "Sorry, I had trouble connecting to my strategic brain. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grandmaster-chat-container">
      <div className="chat-header">
        <h3>
          <span className="material-symbols-outlined">psychology</span>
          Grandmaster Advisor
        </h3>
        {onClose && (
          <button className="icon-btn" onClick={onClose} aria-label="Close chat">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            {m.text}
          </div>
        ))}
        {isLoading && <div className="typing-indicator">Thinking...</div>}
        <div className="messages-end" ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask for advice..."
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()}>
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  );
};
