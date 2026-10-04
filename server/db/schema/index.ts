/**
 * Phase 02 schema: users (profile fields) + pets and health records.
 *
 * Future modules (do not implement yet):
 * providers, services, availability, bookings,
 * payments, reviews, messages, notifications, favorites,
 * reports, disputes, verification.
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
