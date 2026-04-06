import React from 'react';
import styles from '../page.module.css';

interface MessageBubbleProps {
  content: string;
  role: 'user' | 'ai';
}

function renderMessageContent(content: string) {
  const paragraphs = content.split('\n');
  return paragraphs.map((p, pIndex) => {
    if (!p.trim()) return <br key={pIndex} />;

    const boldParts = p.split(/\*\*(.*?)\*\*/g);
    return (
      <div key={pIndex} style={{ marginBottom: '0.4rem' }}>
        {boldParts.map((part, i) => {
          if (i % 2 === 1) {
            return (
              <strong key={i} style={{ fontWeight: 600 }}>
                {part}
              </strong>
            );
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
}

export default function MessageBubble({ content, role }: MessageBubbleProps) {
  return (
    <div
      className={`${styles.message} ${
        role === 'user' ? styles.messageUser : styles.messageAi
      }`}
    >
      {renderMessageContent(content)}
    </div>
  );
}
