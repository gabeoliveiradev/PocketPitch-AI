import React from 'react';
import { Message } from '../lib/types';
import MessageBubble from './MessageBubble';
import styles from '../page.module.css';

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatArea({
  messages,
  isTyping,
  chatEndRef,
}: ChatAreaProps) {
  return (
    <main className={styles.chatArea}>
      {messages.map((msg, index) => (
        <MessageBubble key={msg.id || index} content={msg.content} role={msg.role} />
      ))}
      {isTyping && (
        <div
          className={`${styles.message} ${styles.messageAi} ${styles.typingIndicator}`}
        >
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
        </div>
      )}
      <div ref={chatEndRef} />
    </main>
  );
}
