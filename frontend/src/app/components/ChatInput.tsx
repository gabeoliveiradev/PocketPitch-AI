import React from 'react';
import { QUICK_ACTIONS } from '../lib/api';
import styles from '../page.module.css';

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  isTyping: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onSend: (text: string) => void;
}

export default function ChatInput({
  input,
  setInput,
  isTyping,
  textareaRef,
  onSend,
}: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isTyping) {
        onSend(input);
        setInput('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <footer className={styles.inputContainer}>
      <div className={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            className={styles.actionButton}
            onClick={() => onSend(action)}
          >
            {action}
          </button>
        ))}
      </div>

      <form className={styles.inputRow} onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className={styles.inputField}
          placeholder="Digite algo ou use uma ação..."
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
          rows={1}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!input.trim() || isTyping}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </footer>
  );
}
