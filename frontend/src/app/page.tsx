'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface Conversation {
  id: number;
  created_at: string;
  messages?: Message[];
}

interface User {
  id: number;
  username: string;
  email: string;
}

const QUICK_ACTIONS = [
  "Criar Pitch 30s",
  "Dica de Quebra-gelo",
  "Contornar Objeção de Preço",
  "Resumo do Cliente"
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // App State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<number | null>(null);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial check for auth
  useEffect(() => {
    checkAuth();
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/me/`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        loadConversations();
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isLoginView ? '/api/login/' : '/api/register/';
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
        credentials: 'include'
      });

      if (res.ok) {
        if (!isLoginView) {
          // If registered successfully, auto login
          setIsLoginView(true);
          setAuthError('Conta criada! Por favor, faça login.');
          return;
        }
        const data = await res.json();
        setUser(data.user);
        loadConversations();
      } else {
        const err = await res.json();
        setAuthError(err.error || 'Erro na autenticação');
      }
    } catch (e) {
      setAuthError('Erro ao conectar ao servidor');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/logout/`, { method: 'POST', credentials: 'include' });
      setUser(null);
      setConversations([]);
      setMessages([]);
      setCurrentConvId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const loadConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/conversations/`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !currentConvId) {
            loadConversationDetails(data[0].id);
        } else if (data.length === 0) {
            startNewChat();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadConversationDetails = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/conversations/${id}/`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCurrentConvId(data.id);
        setMessages(data.messages || []);
        setIsSidebarOpen(false); // Close sidebar on mobile after selecting
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startNewChat = () => {
    setCurrentConvId(null);
    setMessages([
      {
        id: 'welcome',
        role: 'ai',
        content: 'Olá! Sou seu co-piloto de vendas, o PocketPitch AI. Como posso te ajudar a fechar o próximo negócio hoje?'
      }
    ]);
    setIsSidebarOpen(false);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const bodyPayload: any = { message: text };
      if (currentConvId) {
        bodyPayload.conversation_id = currentConvId;
      }

      const response = await fetch(`${API_URL}/api/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMsg = `Erro HTTP: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData.error) errorMsg += ` - ${errorData.error}`;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: data.content || 'A resposta da IA não retornou conteúdo válido.'
      };
      
      if (!currentConvId && data.conversation_id) {
          setCurrentConvId(data.conversation_id);
          // Refresh conversation list to show the new one
          loadConversations();
      }

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error('Falha na comunicação com a API:', error);
      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: error.message || 'Houve um problema de conexão com os nossos servidores. Por favor, tente novamente.' 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authLogo}>
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" stroke="currentColor" style={{marginRight: '8px'}}>
              <rect x="25" y="15" width="50" height="70" rx="10" ry="10" strokeWidth="8" />
              <path d="M15 60 L40 38 L55 52 L82 28" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <polygon points="76,21 92,20 85,35" fill="currentColor" />
            </svg>
            PocketPitch AI
          </div>
          <h2 className={styles.authTitle}>{isLoginView ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
          
          <form onSubmit={handleAuth} className={styles.authForm}>
            <input 
              type="text" 
              placeholder="Username" 
              value={authUsername} 
              onChange={e => setAuthUsername(e.target.value)} 
              className={styles.authInput}
              required
            />
            <input 
              type="password" 
              placeholder="Senha" 
              value={authPassword} 
              onChange={e => setAuthPassword(e.target.value)} 
              className={styles.authInput}
              required
            />
            
            {authError && <div className={styles.authError}>{authError}</div>}
            
            <button type="submit" className={styles.authSubmitBtn}>
              {isLoginView ? 'Entrar' : 'Registrar'}
            </button>
          </form>

          <p className={styles.authSwitchText}>
            {isLoginView ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
            <button className={styles.authSwitchBtn} onClick={() => setIsLoginView(!isLoginView)}>
              {isLoginView ? 'Crie agora' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.appWrapper}>
      {/* Sidebar Overlay */}
      {isSidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)} />}
      
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <button onClick={startNewChat} className={styles.newChatBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span style={{marginLeft: '10px'}}>Novo Chat</span>
          </button>
        </div>
        
        <div className={styles.historyList}>
          <h3 className={styles.historyTitle}>Recentes</h3>
          {conversations.map(conv => (
            <button 
                key={conv.id} 
                className={`${styles.historyItem} ${currentConvId === conv.id ? styles.historyItemActive : ''}`}
                onClick={() => loadConversationDetails(conv.id)}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Conversa #{conv.id}
            </button>
          ))}
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.userSection}>
            <div className={styles.userAvatar}>
                {user.username.charAt(0).toUpperCase()}
            </div>
            <span className={styles.userName}>{user.username}</span>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>Sair</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.container}>
        <header className={styles.header}>
          <button className={styles.menuHamburger} onClick={() => setIsSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <div className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none" stroke="currentColor">
              <rect x="25" y="15" width="50" height="70" rx="10" ry="10" strokeWidth="8" />
              <path d="M15 60 L40 38 L55 52 L82 28" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <polygon points="76,21 92,20 85,35" fill="currentColor" />
            </svg>
            PocketPitch AI
          </div>
          {/* Empty div to balance header flexbox */}
          <div style={{width: '24px'}}></div>
        </header>

        <main className={styles.chatArea}>
          {messages.map((msg, index) => (
            <div key={msg.id || index} className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAi}`}>
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
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
