import { useState } from 'react';
import { Conversation, Message } from '../lib/types';
import { apiFetch } from '../lib/api';

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'ai',
  content:
    'Olá! Sou seu co-piloto de vendas, o PocketPitch AI. Como posso te ajudar a fechar o próximo negócio hoje?',
};

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);

  // Options menu & modal state
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renamingTitle, setRenamingTitle] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [convToDelete, setConvToDelete] = useState<number | null>(null);

  const loadConversations = async () => {
    const { ok, data } = await apiFetch('/api/conversations/');
    if (ok) {
      setConversations(data);
      return data as Conversation[];
    }
    return [];
  };

  const loadConversationDetails = async (id: number) => {
    const { ok, data } = await apiFetch(`/api/conversations/${id}/`);
    if (ok) {
      setCurrentConvId(data.id);
      setMessages(data.messages || []);
    }
  };

  const startNewChat = () => {
    setCurrentConvId(null);
    setMessages([WELCOME_MESSAGE]);
  };

  const confirmDelete = async () => {
    if (convToDelete === null) return;
    const { ok } = await apiFetch(`/api/conversations/${convToDelete}/`, {
      method: 'DELETE',
    });
    if (ok) {
      setConversations((prev: Conversation[]) => prev.filter((c: Conversation) => c.id !== convToDelete));
      if (currentConvId === convToDelete) {
        startNewChat();
      }
    }
    setIsDeleteModalOpen(false);
    setConvToDelete(null);
  };

  const handleRenameSubmit = async (id: number) => {
    if (!renamingTitle.trim()) {
      setRenamingId(null);
      return;
    }
    const { ok } = await apiFetch(`/api/conversations/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ title: renamingTitle }),
    });
    if (ok) {
      setConversations((prev: Conversation[]) =>
        prev.map((c: Conversation) => (c.id === id ? { ...c, title: renamingTitle } : c)),
      );
    }
    setRenamingId(null);
  };

  const resetConversations = () => {
    setConversations([]);
    setMessages([]);
    setCurrentConvId(null);
  };

  return {
    conversations,
    currentConvId,
    setCurrentConvId,
    messages,
    setMessages,
    openMenuId,
    setOpenMenuId,
    renamingId,
    setRenamingId,
    renamingTitle,
    setRenamingTitle,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    convToDelete,
    setConvToDelete,
    loadConversations,
    loadConversationDetails,
    startNewChat,
    confirmDelete,
    handleRenameSubmit,
    resetConversations,
  };
}
