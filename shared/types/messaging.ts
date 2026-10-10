import type { ConversationKind } from '../constants/messaging'

export interface ConversationParticipant {
  userId: string
  displayName: string
  lastReadAt: string | null
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  body: string | null
  attachmentUrl: string | null
  createdAt: string
}

export interface Conversation {
  id: string
  kind: ConversationKind
  bookingId: string | null
  providerId: string | null
  title: string
  lastMessageAt: string | null
  lastMessagePreview: string | null
  unreadCount: number
  participants: ConversationParticipant[]
  createdAt: string
}

export interface ConversationDetail extends Conversation {
  messages: Message[]
}
