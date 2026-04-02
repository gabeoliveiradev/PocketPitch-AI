'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

const QUICK_ACTIONS = [
  "Criar Pitch 30s",
  "Dica de Quebra-gelo",
  "Contornar Objeção de Preço",
  "Resumo do Cliente"
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: 'Olá! Sou seu co-piloto de vendas, o PocketPitch AI. Como posso te ajudar a fechar o próximo negócio hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // TODO: Replace with real API call pointing to Django endpoint
      console.log('Sending to Django API via Docker...');
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/`, { ... })
      
      // MOCK WAITING TIME
      setTimeout(() => {
        const aiMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          role: 'ai', 
          content: 'Entendido! Aqui está um retorno baseado na sua solicitação. (Mock de Resposta da API)' 
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }, 1500);

    } catch (error) {
      console.error(error);
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          PocketPitch AI
        </div>
      </header>

      <main className={styles.chatArea}>
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAi}`}>
            {msg.content}
          </div>
        ))}
        {isTyping && (
          <div className={`${styles.message} ${styles.messageAi} ${styles.typingIndicator}`}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      <footer className={styles.inputContainer}>
        <div className={styles.quickActions}>
          {QUICK_ACTIONS.map(action => (
            <button 
              key={action} 
              className={styles.actionButton}
              onClick={() => handleSend(action)}
            >
              {action}
            </button>
          ))}
        </div>
        
        <form 
          className={styles.inputRow} 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
        >
          <input 
            type="text" 
            className={styles.inputField} 
            placeholder="Digite algo ou use uma ação..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
          />
          <button type="submit" className={styles.sendButton} disabled={!input.trim() || isTyping}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
