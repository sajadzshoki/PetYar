/**
 * Phase 03 schema: users, pets, providers, services, categories.
 *
 * Phase 04 adds search indexes on providers/services.
 *
 * Phase 05: weekly availability rules and date exceptions.
 *
 * Phase 06: bookings (no payments).
 *
 * Future modules (do not implement yet):
 * payments, reviews, messages,
 * notifications, favorites, reports, disputes workflow, verification.
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
