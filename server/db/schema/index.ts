/**
 * Phase 03 schema: users, pets, providers, services, categories.
 *
 * Future modules (do not implement yet):
 * availability, bookings, payments, reviews, messages,
 * notifications, favorites, reports, disputes, verification.
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
