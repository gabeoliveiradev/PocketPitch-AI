export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export interface Conversation {
  id: number;
  title?: string;
  created_at: string;
  messages?: Message[];
}

export interface User {
  id: number;
  username: string;
  email: string;
}
