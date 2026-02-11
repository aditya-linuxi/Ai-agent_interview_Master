export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export enum InterviewStage {
  SETUP = 'SETUP',
  ACTIVE = 'ACTIVE',
  SUMMARY = 'SUMMARY'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  isAnalysis?: boolean;
}

export interface RoleConfig {
  role: string;
  level: string;
  description: string;
}

export interface AnalysisData {
  clarity: number;
  content: number;
  confidence: number;
  roleFit: number;
}
