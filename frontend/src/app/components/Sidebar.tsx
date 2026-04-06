import React from 'react';
import { Conversation } from '../lib/types';
import { User } from '../lib/types';
import styles from '../page.module.css';

interface SidebarProps {
  user: User;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  conversations: Conversation[];
  currentConvId: number | null;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  renamingId: number | null;
  setRenamingId: (id: number | null) => void;
  renamingTitle: string;
  setRenamingTitle: (v: string) => void;
  setConvToDelete: (id: number) => void;
  setIsDeleteModalOpen: (v: boolean) => void;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
  onRenameSubmit: (id: number) => void;
  onLogout: () => void;
}

export default function Sidebar({
  user,
  isSidebarOpen,
  setIsSidebarOpen,
  conversations,
  currentConvId,
  openMenuId,
  setOpenMenuId,
  renamingId,
  setRenamingId,
  renamingTitle,
  setRenamingTitle,
  setConvToDelete,
  setIsDeleteModalOpen,
  onSelectConversation,
  onNewChat,
  onRenameSubmit,
  onLogout,
}: SidebarProps) {
  const handleSelectConversation = (id: number) => {
    onSelectConversation(id);
    setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    onNewChat();
    setIsSidebarOpen(false);
  };

  return (
    <>
      {isSidebarOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <button onClick={handleNewChat} className={styles.newChatBtn}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span style={{ marginLeft: '10px' }}>Novo Chat</span>
          </button>
        </div>

        <div className={styles.historyList}>
          <h3 className={styles.historyTitle}>Recentes</h3>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`${styles.historyItemContainer} ${
                currentConvId === conv.id
                  ? styles.historyItemContainerActive
                  : ''
              }`}
            >
              <button
                className={styles.historyItemBtn}
                onClick={() => handleSelectConversation(conv.id)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {renamingId === conv.id ? (
                  <input
                    type="text"
                    value={renamingTitle}
                    onChange={(e) => setRenamingTitle(e.target.value)}
                    onBlur={() => onRenameSubmit(conv.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onRenameSubmit(conv.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className={styles.renameInput}
                  />
                ) : (
                  <span className={styles.historyTitleText}>
                    {conv.title || `Conversa #${conv.id}`}
                  </span>
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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>

                {openMenuId === conv.id && (
                  <div className={styles.optionsMenu}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(conv.id);
                        setRenamingTitle(
                          conv.title || `Conversa #${conv.id}`,
                        );
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
          <button onClick={onLogout} className={styles.logoutBtn}>
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
