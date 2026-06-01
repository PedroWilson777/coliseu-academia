// Tipos compartilhados entre os componentes do chat

export interface ConvListItem {
  id: string;
  type: 'STUDENT' | 'LEAD';
  name: string;
  phone: string;
  status: string;
  qualification?: string;
  stage?: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt: string;
  isAudio: boolean;
}

export interface MessageItem {
  id: string;
  sender: 'CLIENT' | 'AI' | 'HUMAN';
  content: string;
  authorName?: string;
  createdAt: string;
  isAudio: boolean;
  audioTranscript?: string;
  audioBase64?: string;
}

export interface ConvDetail {
  id: string;
  status: string;
  type: 'STUDENT' | 'LEAD';
  person: {
    id: string;
    name?: string;
    phone: string;
    qualification?: string;
    stage?: string;
    notes?: string;
    interestedModality?: string;
    interestedPlan?: string;
    paymentMethod?: string;
    experimentalDone?: boolean;
    modality?: string;
    plan?: string;
    paymentDay?: number;
  };
  messages: MessageItem[];
}
