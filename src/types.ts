export type Category = 'Civil' | 'Criminal' | 'Property' | 'Consumer' | 'Family Law' | 'General';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  category?: Category;
  language?: 'ta' | 'en';
  sources?: { title: string; uri: string }[];
}

export interface LegalContext {
  title: string;
  content: string;
  source: string;
}
