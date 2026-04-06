import React from 'react';
import styles from '../page.module.css';

interface DeleteModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteModal({ onCancel, onConfirm }: DeleteModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalIconWarning}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h3 className={styles.modalTitle}>Excluir Conversa</h3>
        <p className={styles.modalText}>
          Tem certeza que deseja excluir esta conversa? Esta ação não poderá ser
          desfeita.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.modalCancelBtn} onClick={onCancel}>
            Cancelar
          </button>
          <button className={styles.modalDeleteBtn} onClick={onConfirm}>
            Sim, excluir
          </button>
        </div>
      </div>
    </div>
  );
}
