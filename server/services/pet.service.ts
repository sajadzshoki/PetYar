import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '../db/client'
import { petCareNotes, petMedications, petVaccinations, pets } from '../db/schema'
import type { CareNoteRow, MedicationRow, PetRow, VaccinationRow } from '../db/schema/pets'
import type { CareNote, Medication, Pet, PetDetail, Vaccination } from '../../shared/types/pet'
import type { CareNoteWriteInput, MedicationWriteInput, PetWriteInput, VaccinationWriteInput } from '../../shared/validation/pet'
import { forbidden, notFound } from '../utils/errors'
import { getObjectStorage } from '../storage'
import { mediaKey, mediaUrl } from '../utils/media'
import { logger } from '../utils/logger'

function emptyToNull(value?: string | null) {
  if (!value) return null
  const t = value.trim()
  return t.length ? t : null
}

function toPet(row: PetRow): Pet {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    breed: row.breed,
    gender: row.gender,
    birthDate: row.birthDate,
    weightKg: row.weightKg === null ? null : Number(row.weightKg),
    photoUrl: mediaUrl(row.photoKey),
    behaviorNotes: row.behaviorNotes,
    allergies: row.allergies,
    medicalNotes: row.medicalNotes,
    neutered: row.neutered,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toVaccination(row: VaccinationRow): Vaccination {
  return {
    id: row.id,
    petId: row.petId,
    name: row.name,
    administeredOn: row.administeredOn,
    nextDueOn: row.nextDueOn,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  }
}

function toMedication(row: MedicationRow): Medication {
  return {
    id: row.id,
    petId: row.petId,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    startedOn: row.startedOn,
    endedOn: row.endedOn,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  }
}

function toCareNote(row: CareNoteRow): CareNote {
  return {
    id: row.id,
    petId: row.petId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function petValues(input: PetWriteInput) {
  return {
    name: input.name,
    type: input.type,
    breed: emptyToNull(input.breed),
    gender: input.gender ?? 'UNKNOWN',
    birthDate: emptyToNull(input.birthDate),
    weightKg: input.weightKg == null ? null : String(input.weightKg),
    behaviorNotes: emptyToNull(input.behaviorNotes),
    allergies: emptyToNull(input.allergies),
    medicalNotes: emptyToNull(input.medicalNotes),
    neutered: input.neutered ?? false,
    updatedAt: new Date(),
  }
}

export const petService = {
  async list(ownerId: string, includeArchived = false): Promise<Pet[]> {
    const db = getDb()
    const rows = includeArchived
      ? await db.select().from(pets).where(eq(pets.ownerId, ownerId)).orderBy(desc(pets.createdAt))
      : await db.select().from(pets).where(and(eq(pets.ownerId, ownerId), isNull(pets.archivedAt))).orderBy(desc(pets.createdAt))
    return rows.map(toPet)
  },

  async getOwned(ownerId: string, petId: string): Promise<PetRow> {
    const db = getDb()
    const [row] = await db.select().from(pets).where(eq(pets.id, petId)).limit(1)
    if (!row) throw notFound('حیوان خانگی یافت نشد')
    if (row.ownerId !== ownerId) throw forbidden('دسترسی به این پرونده مجاز نیست')
    return row
  },

  async getDetail(ownerId: string, petId: string): Promise<PetDetail> {
    const row = await this.getOwned(ownerId, petId)
    const db = getDb()
    const [vaccinations, medications, careNotes] = await Promise.all([
      db.select().from(petVaccinations).where(eq(petVaccinations.petId, petId)).orderBy(desc(petVaccinations.administeredOn)),
      db.select().from(petMedications).where(eq(petMedications.petId, petId)).orderBy(desc(petMedications.createdAt)),
      db.select().from(petCareNotes).where(eq(petCareNotes.petId, petId)).orderBy(desc(petCareNotes.createdAt)),
    ])
    return {
      ...toPet(row),
      vaccinations: vaccinations.map(toVaccination),
      medications: medications.map(toMedication),
      careNotes: careNotes.map(toCareNote),
    }
  },

  async create(ownerId: string, input: PetWriteInput): Promise<Pet> {
    const db = getDb()
    const [created] = await db.insert(pets).values({
      ownerId,
      ...petValues(input),
    }).returning()
    if (!created) throw new Error('Failed to create pet')
    logger.info('pet_created', { ownerId, petId: created.id })
    return toPet(created)
  },

  async update(ownerId: string, petId: string, input: PetWriteInput): Promise<Pet> {
    await this.getOwned(ownerId, petId)
    const db = getDb()
    const [updated] = await db.update(pets).set(petValues(input)).where(eq(pets.id, petId)).returning()
    if (!updated) throw notFound('حیوان خانگی یافت نشد')
    logger.info('pet_updated', { ownerId, petId })
    return toPet(updated)
  },

  async archive(ownerId: string, petId: string): Promise<Pet> {
    await this.getOwned(ownerId, petId)
    const db = getDb()
    const [updated] = await db.update(pets).set({
      archivedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(pets.id, petId)).returning()
    if (!updated) throw notFound('حیوان خانگی یافت نشد')
    logger.info('pet_archived', { ownerId, petId })
    return toPet(updated)
  },

  async restore(ownerId: string, petId: string): Promise<Pet> {
    await this.getOwned(ownerId, petId)
    const db = getDb()
    const [updated] = await db.update(pets).set({
      archivedAt: null,
      updatedAt: new Date(),
    }).where(eq(pets.id, petId)).returning()
    if (!updated) throw notFound('حیوان خانگی یافت نشد')
    logger.info('pet_restored', { ownerId, petId })
    return toPet(updated)
  },

  async setPhoto(ownerId: string, petId: string, body: Buffer, contentType: string): Promise<Pet> {
    const row = await this.getOwned(ownerId, petId)
    const storage = getObjectStorage()
    if (row.photoKey) await storage.delete(row.photoKey)
    const key = mediaKey(`pets/${ownerId}/${petId}`, contentType)
    await storage.put(key, body, contentType)
    const db = getDb()
    const [updated] = await db.update(pets).set({
      photoKey: key,
      updatedAt: new Date(),
    }).where(eq(pets.id, petId)).returning()
    if (!updated) throw notFound('حیوان خانگی یافت نشد')
    return toPet(updated)
  },

  async addVaccination(ownerId: string, petId: string, input: VaccinationWriteInput): Promise<Vaccination> {
    await this.getOwned(ownerId, petId)
    const db = getDb()
    const [row] = await db.insert(petVaccinations).values({
      petId,
      name: input.name,
      administeredOn: input.administeredOn,
      nextDueOn: emptyToNull(input.nextDueOn),
      notes: emptyToNull(input.notes),
    }).returning()
    if (!row) throw new Error('Failed to create vaccination')
    return toVaccination(row)
  },

  async deleteVaccination(ownerId: string, petId: string, id: string) {
    await this.getOwned(ownerId, petId)
    const db = getDb()
    const deleted = await db.delete(petVaccinations).where(and(eq(petVaccinations.id, id), eq(petVaccinations.petId, petId))).returning()
    if (!deleted.length) throw notFound('سابقه واکسن یافت نشد')
  },

  async addMedication(ownerId: string, petId: string, input: MedicationWriteInput): Promise<Medication> {
    await this.getOwned(ownerId, petId)
    const db = getDb()
    const [row] = await db.insert(petMedications).values({
      petId,
      name: input.name,
      dosage: emptyToNull(input.dosage),
      frequency: emptyToNull(input.frequency),
      startedOn: emptyToNull(input.startedOn),
      endedOn: emptyToNull(input.endedOn),
      notes: emptyToNull(input.notes),
    }).returning()
    if (!row) throw new Error('Failed to create medication')
    return toMedication(row)
  },

  async deleteMedication(ownerId: string, petId: string, id: string) {
    await this.getOwned(ownerId, petId)
    const db = getDb()
    const deleted = await db.delete(petMedications).where(and(eq(petMedications.id, id), eq(petMedications.petId, petId))).returning()
    if (!deleted.length) throw notFound('دارو یافت نشد')
  },

  async addCareNote(ownerId: string, petId: string, input: CareNoteWriteInput): Promise<CareNote> {
    await this.getOwned(ownerId, petId)
    const db = getDb()
    const [row] = await db.insert(petCareNotes).values({
      petId,
      body: input.body,
    }).returning()
    if (!row) throw new Error('Failed to create care note')
    return toCareNote(row)
  },

  async deleteCareNote(ownerId: string, petId: string, id: string) {
    await this.getOwned(ownerId, petId)
    const db = getDb()
    const deleted = await db.delete(petCareNotes).where(and(eq(petCareNotes.id, id), eq(petCareNotes.petId, petId))).returning()
    if (!deleted.length) throw notFound('یادداشت یافت نشد')
  },
}
