/**
 * Phase 03 schema: users, pets, providers, services, categories.
 *
 * Phase 04 adds search indexes on providers/services.
 *
 * Phase 05: weekly availability rules and date exceptions.
 *
 * Phase 06: bookings.
 * Phase 07: payments, transactions, refunds (gateway abstraction).
 * Phase 08: conversations, messages, in-app notifications.
 * Phase 09: reviews, ratings, favorites (no fake verification).
 *
 * Future modules (do not implement yet):
 * reports, disputes workflow, verification badges, realtime transport.
 */
export { users, userRoleEnum } from './users'
export type { UserRow, NewUserRow } from './users'
export {
  pets,
  petVaccinations,
  petMedications,
  petCareNotes,
  petTypeEnum,
  petGenderEnum,
} from './pets'
export type { PetRow, VaccinationRow, MedicationRow, CareNoteRow } from './pets'
export {
  providers,
  providerGallery,
  providerServices,
  serviceCategories,
  pricingTypeEnum,
} from './providers'
export type { ProviderRow, GalleryRow, ProviderServiceRow, CategoryRow } from './providers'
export { availabilityRules, availabilityExceptions, exceptionKindEnum } from './availability'
export type { AvailabilityRuleRow, AvailabilityExceptionRow } from './availability'
export { bookings, bookingStatusEnum, cancelledByEnum } from './bookings'
export type { BookingRow } from './bookings'
export { payments, paymentTransactions, paymentStatusEnum, paymentTransactionTypeEnum } from './payments'
export type { PaymentRow, PaymentTransactionRow } from './payments'
export { conversations, conversationParticipants, messages, conversationKindEnum } from './messaging'
export type { ConversationRow, ParticipantRow, MessageRow } from './messaging'
export { notifications, notificationTypeEnum } from './notifications'
export type { NotificationRow } from './notifications'
export { reviews, favorites } from './reviews'
export type { ReviewRow, FavoriteRow } from './reviews'
