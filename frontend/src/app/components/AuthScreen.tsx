import React from 'react';
import styles from '../page.module.css';

interface AuthScreenProps {
  isLoginView: boolean;
  setIsLoginView: (v: boolean) => void;
  authUsername: string;
  setAuthUsername: (v: string) => void;
  authPassword: string;
  setAuthPassword: (v: string) => void;
  authError: string;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AuthScreen({
  isLoginView,
  setIsLoginView,
  authUsername,
  setAuthUsername,
  authPassword,
  setAuthPassword,
  authError,
  onSubmit,
}: AuthScreenProps) {
  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            style={{ marginRight: '8px' }}
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
        <h2 className={styles.authTitle}>
          {isLoginView ? 'Bem-vindo de volta' : 'Crie sua conta'}
        </h2>

        <form onSubmit={onSubmit} className={styles.authForm}>
          <input
            type="text"
            placeholder="Username"
            value={authUsername}
            onChange={(e) => setAuthUsername(e.target.value)}
            className={styles.authInput}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
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
          <button
            className={styles.authSwitchBtn}
            onClick={() => setIsLoginView(!isLoginView)}
          >
            {isLoginView ? 'Crie agora' : 'Faça login'}
          </button>
        </p>
      </div>
    </div>
  );
}
