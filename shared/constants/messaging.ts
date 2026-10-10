export const CONVERSATION_KINDS = ['INQUIRY', 'BOOKING'] as const
export type ConversationKind = (typeof CONVERSATION_KINDS)[number]

export const MAX_MESSAGE_LENGTH = 4000
