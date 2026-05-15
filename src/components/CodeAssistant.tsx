
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import './CodeAssistant.css';

interface HistoryItem {
  type: 'user' | 'bot' | 'info' | 'error';
  content: string;
}

export const CodeAssistant: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'info', content: 'Universal Code Assistant v1.0.0 initialized...' },
    { type: 'info', content: 'Supported languages: JS, TS, CSS, Python, Node.js, C++, and more.' },
    { type: 'bot', content: 'How can I assist your development today?' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleExecute = async () => {
    if (!input.trim() || isProcessing) return;

    const command = input.trim();
    setInput('');
    setHistory(prev => [...prev, { type: 'user', content: command }]);
    setIsProcessing(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API_KEY not found. Please set GEMINI_API_KEY in Secrets.');
      }

      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const context = history
        .slice(-6)
        .map(h => `${h.type === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
        .join('\n');

      const systemPrompt = `You are a world-class polyglot software engineer and technical architect.
You specialize in:
- Web: JS/TS, React, CSS, HTML
- Backend: Node.js, Python, Rust, Go, SQL
- DevOps: Docker, npm, Git, CI/CD
- Algorithms & Optimization

Instructions:
- Provide high-quality, production-ready code snippets.
- Explain technical concepts clearly.
- If asked about the current environment, note that it is a Node.js runtime.
- Be concise. Use Markdown-like code formatting in your responses (backticks).
- If the user asks for Python, provide pure Python code.
- Respond with a terminal-friendly tone.`;

      const result = await model.generateContent(`${systemPrompt}\n\nRecent History:\n${context}\n\nCommand: ${command}\nOutput:`);
      const response = await result.response;
      const text = response.text();

      setHistory(prev => [...prev, { type: 'bot', content: text }]);
    } catch (err: any) {
      setHistory(prev => [...prev, { type: 'error', content: `CRITICAL ERROR: ${err.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="code-assistant-container">
      <div className="assistant-header">
        <h3>
          <span className="material-symbols-outlined">terminal</span>
          Code Assistant
        </h3>
        {onClose && (
          <button className="icon-btn" onClick={onClose} style={{ color: '#00ff41' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>
      
      <div className="terminal-window">
        {history.map((item, index) => (
          <div key={index} className={`terminal-line ${item.type}`}>
            {item.content}
          </div>
        ))}
        {isProcessing && <div className="terminal-line info">Executing remote analysis...</div>}
        <div ref={terminalEndRef} />
      </div>

      <div className="input-line">
        <span className="prompt">ais~&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
          placeholder="..."
          autoFocus
          disabled={isProcessing}
        />
        <div className="cursor" />
        <button onClick={handleExecute} disabled={isProcessing || !input.trim()}>
          RUN
        </button>
      </div>
    </div>
  );
};
