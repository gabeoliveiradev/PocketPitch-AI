'use client';

import { useEffect } from 'react';
import styles from './page.module.css';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';

// Components
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';
import DeleteModal from './components/DeleteModal';

import { useState } from 'react';

export default function Home() {
  const auth = useAuth();
  const conv = useConversations();

  const chat = useChat({
    currentConvId: conv.currentConvId,
    setCurrentConvId: conv.setCurrentConvId,
    messages: conv.messages,
    setMessages: conv.setMessages,
    loadConversations: conv.loadConversations,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initial auth check
  useEffect(() => {
    const init = async () => {
      const user = await auth.checkAuth();
      if (user) {
        const convList = await conv.loadConversations();
        if (convList.length > 0) {
          conv.loadConversationDetails(convList[0].id);
        } else {
          conv.startNewChat();
        }
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close options menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      if (conv.openMenuId !== null) {
        conv.setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [conv.openMenuId, conv.setOpenMenuId]);

  // Auto-scroll on new messages
  useEffect(() => {
    chat.scrollToBottom();
  }, [conv.messages, chat.isTyping]);

  // Handle auth submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    const success = await auth.handleAuth(e);
    if (success) {
      const convList = await conv.loadConversations();
      if (convList.length > 0) {
        conv.loadConversationDetails(convList[0].id);
      } else {
        conv.startNewChat();
      }
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await auth.handleLogout();
    conv.resetConversations();
  };

  // ---------- RENDER ----------

  if (!auth.user) {
    return (
      <AuthScreen
        isLoginView={auth.isLoginView}
        setIsLoginView={auth.setIsLoginView}
        authUsername={auth.authUsername}
        setAuthUsername={auth.setAuthUsername}
        authPassword={auth.authPassword}
        setAuthPassword={auth.setAuthPassword}
        authError={auth.authError}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <div className={styles.appWrapper}>
      {/* Delete Confirmation Modal */}
      {conv.isDeleteModalOpen && (
        <DeleteModal
          onCancel={() => conv.setIsDeleteModalOpen(false)}
          onConfirm={conv.confirmDelete}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        user={auth.user}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        conversations={conv.conversations}
        currentConvId={conv.currentConvId}
        openMenuId={conv.openMenuId}
        setOpenMenuId={conv.setOpenMenuId}
        renamingId={conv.renamingId}
        setRenamingId={conv.setRenamingId}
        renamingTitle={conv.renamingTitle}
        setRenamingTitle={conv.setRenamingTitle}
        setConvToDelete={conv.setConvToDelete}
        setIsDeleteModalOpen={conv.setIsDeleteModalOpen}
        onSelectConversation={conv.loadConversationDetails}
        onNewChat={conv.startNewChat}
        onRenameSubmit={conv.handleRenameSubmit}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className={styles.container}>
        <header className={styles.header}>
          <button
            className={styles.menuHamburger}
            onClick={() => setIsSidebarOpen(true)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <div className={styles.logo}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
            >
              <rect
                x="25"
                y="15"
                width="50"
                height="70"
                rx="10"
                ry="10"
                strokeWidth="8"
              />
              <path
                d="M15 60 L40 38 L55 52 L82 28"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polygon points="76,21 92,20 85,35" fill="currentColor" />
            </svg>
            PocketPitch AI
          </div>
          <div style={{ width: '24px' }}></div>
        </header>

        <ChatArea
          messages={conv.messages}
          isTyping={chat.isTyping}
          chatEndRef={chat.chatEndRef}
        />

        <ChatInput
          input={chat.input}
          setInput={chat.setInput}
          isTyping={chat.isTyping}
          textareaRef={chat.textareaRef}
          onSend={chat.handleSend}
        />
      </div>
    </div>
  );
}
