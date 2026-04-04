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
  title?: string;
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

// Dynamically resolve API URL so it works from any device on the network (phone via IP, PC via localhost)
const API_URL = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:8000`
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

const renderMessageContent = (content: string) => {
  const paragraphs = content.split('\n');
  return paragraphs.map((p, pIndex) => {
    if (!p.trim()) return <br key={pIndex} />;
    
    const boldParts = p.split(/\*\*(.*?)\*\*/g);
    return (
      <div key={pIndex} style={{ marginBottom: '0.4rem' }}>
        {boldParts.map((part, i) => {
          if (i % 2 === 1) {
            return <strong key={i} style={{ fontWeight: 600 }}>{part}</strong>;
          }
          if (part) {
            const italicParts = part.split(/\*(.*?)\*/g);
            return italicParts.map((ip, j) => {
               if (j % 2 === 1) return <em key={j}>{ip}</em>;
               return <span key={j}>{ip}</span>;
            });
          }
          return null;
        })}
      </div>
    );
  });
};

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

  // Options Menu & Modal State
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renamingTitle, setRenamingTitle] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [convToDelete, setConvToDelete] = useState<number | null>(null);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initial check for auth
  useEffect(() => {
    checkAuth();
  }, []);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

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

  const confirmDelete = async () => {
    if (convToDelete === null) return;
    try {
      const res = await fetch(`${API_URL}/api/conversations/${convToDelete}/`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok || res.status === 204) {
        setConversations(prev => prev.filter(c => c.id !== convToDelete));
        if (currentConvId === convToDelete) {
          startNewChat();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleteModalOpen(false);
      setConvToDelete(null);
    }
  };

  const handleRenameSubmit = async (id: number) => {
    if (!renamingTitle.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/conversations/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renamingTitle }),
        credentials: 'include'
      });
      if (res.ok) {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, title: renamingTitle } : c));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRenamingId(null);
    }
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

      if (!response.body) throw new Error("Sem acesso à stream de resposta.");
      
      // Initialize an empty AI message to hold the stream
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', content: '' }]);
      setIsTyping(false); // Typing indicator will stop since the text will type itself
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let doneReading = false;
      let finalConvId = null;

      let partialBuffer = "";

      while (!doneReading) {
        const { value, done } = await reader.read();
        doneReading = done;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          partialBuffer += chunk;
          
          const lines = partialBuffer.split('\n\n');
          // Important: Keep the last partial string if not empty in buffer
          partialBuffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                if (data.error) throw new Error(data.error);
                
                if (data.content) {
                  // Artificial delay to simulate human/AI typing speed more closely to Gemini
                  const charsPerTick = 2; // Inject 2 characters at a time
                  for (let i = 0; i < data.content.length; i += charsPerTick) {
                    const charSlice = data.content.substring(i, i + charsPerTick);
                    setMessages(prev => prev.map(m => 
                      m.id === aiMsgId ? { ...m, content: m.content + charSlice } : m
                    ));
                    // 15ms delay = 133 chars per second approx, smoothing out the fast server responses
                    await new Promise(resolve => setTimeout(resolve, 15));
                  }
                }
                
                if (data.done) finalConvId = data.conversation_id;
              } catch (e: any) {
                // Ignore parsing errors for small malformed chunks if any
                if (e.message !== "Unexpected end of JSON input") {
                    console.error("Parse error:", e);
                }
              }
            }
          }
        }
      }

      if (!currentConvId && finalConvId) {
          setCurrentConvId(finalConvId);
          loadConversations();
      }
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error: any) {
      console.error('Falha na comunicação com a API:', error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: error.message || 'Houve um problema de conexão com os nossos servidores. Por favor, tente novamente.' 
      }]);
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
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIconWarning}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 className={styles.modalTitle}>Excluir Conversa</h3>
            <p className={styles.modalText}>Tem certeza que deseja excluir esta conversa? Esta ação não poderá ser desfeita.</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
              <button className={styles.modalDeleteBtn} onClick={confirmDelete}>Sim, excluir</button>
            </div>
          </div>
        </div>
      )}
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
            <div key={conv.id} className={`${styles.historyItemContainer} ${currentConvId === conv.id ? styles.historyItemContainerActive : ''}`}>
              <button 
                  className={styles.historyItemBtn}
                  onClick={() => loadConversationDetails(conv.id)}
              >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {renamingId === conv.id ? (
                      <input 
                        type="text" 
                        value={renamingTitle}
                        onChange={(e) => setRenamingTitle(e.target.value)}
                        onBlur={() => handleRenameSubmit(conv.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit(conv.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className={styles.renameInput}
                      />
                  ) : (
                      <span className={styles.historyTitleText}>{conv.title || `Conversa #${conv.id}`}</span>
                  )}
              </button>

              <div className={styles.optionsWrapper}>
                <button 
                  className={styles.optionsBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === conv.id ? null : conv.id);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="12" cy="5" r="1"/>
                    <circle cx="12" cy="19" r="1"/>
                  </svg>
                </button>

                {openMenuId === conv.id && (
                  <div className={styles.optionsMenu}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(conv.id);
                        setRenamingTitle(conv.title || `Conversa #${conv.id}`);
                        setOpenMenuId(null);
                      }}
                    >
                      Renomear
                    </button>
                    <button 
                      className={styles.deleteOption}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConvToDelete(conv.id);
                        setIsDeleteModalOpen(true);
                        setOpenMenuId(null);
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
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
              {renderMessageContent(msg.content)}
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
            <textarea
              ref={textareaRef}
              className={styles.inputField}
              placeholder="Digite algo ou use uma ação..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !isTyping) {
                    handleSend(input);
                    setInput('');
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto';
                    }
                  }
                }
              }}
              disabled={isTyping}
              rows={1}
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
