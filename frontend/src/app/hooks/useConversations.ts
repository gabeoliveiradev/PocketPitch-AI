'use client';

import { useState } from 'react';
import { Conversation, Message } from '../lib/types';
import { API_URL } from '../lib/api';

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
    try {
      const res = await fetch(`${API_URL}/api/conversations/`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        return data as Conversation[];
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  };

  const loadConversationDetails = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/conversations/${id}/`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentConvId(data.id);
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startNewChat = () => {
    setCurrentConvId(null);
    setMessages([WELCOME_MESSAGE]);
  };

  const confirmDelete = async () => {
    if (convToDelete === null) return;
    try {
      const res = await fetch(
        `${API_URL}/api/conversations/${convToDelete}/`,
        { method: 'DELETE', credentials: 'include' },
      );
      if (res.ok || res.status === 204) {
        setConversations((prev) => prev.filter((c) => c.id !== convToDelete));
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
        credentials: 'include',
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: renamingTitle } : c)),
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRenamingId(null);
    }
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
