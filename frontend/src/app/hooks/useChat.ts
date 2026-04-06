'use client';

import { useState, useRef } from 'react';
import { Message } from '../lib/types';
import { API_URL } from '../lib/api';

interface UseChatOptions {
  currentConvId: number | null;
  setCurrentConvId: (id: number | null) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  loadConversations: () => Promise<unknown>;
}

export function useChat({
  currentConvId,
  setCurrentConvId,
  messages,
  setMessages,
  loadConversations,
}: UseChatOptions) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const bodyPayload: Record<string, unknown> = { message: text };
      if (currentConvId) {
        bodyPayload.conversation_id = currentConvId;
      }

      const response = await fetch(`${API_URL}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        let errorMsg = `Erro HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMsg += ` - ${errorData.error}`;
        } catch {
          // ignore parse error
        }
        throw new Error(errorMsg);
      }

      if (!response.body) throw new Error('Sem acesso à stream de resposta.');

      // Initialize an empty AI message to hold the stream
      const aiMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: aiMsgId, role: 'ai', content: '' }]);
      setIsTyping(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let doneReading = false;
      let finalConvId = null;
      let partialBuffer = '';

      while (!doneReading) {
        const { value, done } = await reader.read();
        doneReading = done;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          partialBuffer += chunk;

          const lines = partialBuffer.split('\n\n');
          partialBuffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;

            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));

                if (data.error) throw new Error(data.error);

                if (data.content) {
                  const charsPerTick = 2;
                  for (let i = 0; i < data.content.length; i += charsPerTick) {
                    const charSlice = data.content.substring(i, i + charsPerTick);
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === aiMsgId
                          ? { ...m, content: m.content + charSlice }
                          : m,
                      ),
                    );
                    await new Promise((resolve) => setTimeout(resolve, 15));
                  }
                }

                if (data.done) finalConvId = data.conversation_id;
              } catch (e: unknown) {
                const err = e as Error;
                if (err.message !== 'Unexpected end of JSON input') {
                  console.error('Parse error:', err);
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Falha na comunicação com a API:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content:
            err.message ||
            'Houve um problema de conexão com os nossos servidores. Por favor, tente novamente.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return {
    input,
    setInput,
    isTyping,
    chatEndRef,
    textareaRef,
    scrollToBottom,
    handleSend,
  };
}
