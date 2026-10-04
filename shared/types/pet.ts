import type { PetGender, PetType } from '../constants/pets'

export interface Pet {
  id: string
  name: string
  type: PetType
  breed: string | null
  gender: PetGender
  birthDate: string | null
  weightKg: number | null
  photoUrl: string | null
  behaviorNotes: string | null
  allergies: string | null
  medicalNotes: string | null
  neutered: boolean
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Vaccination {
  id: string
  petId: string
  name: string
  administeredOn: string
  nextDueOn: string | null
  notes: string | null
  createdAt: string
}

export interface Medication {
  id: string
  petId: string
  name: string
  dosage: string | null
  frequency: string | null
  startedOn: string | null
  endedOn: string | null
  notes: string | null
  createdAt: string
}

export interface CareNote {
  id: string
  petId: string
  body: string
  createdAt: string
  updatedAt: string
}

export interface PetDetail extends Pet {
  vaccinations: Vaccination[]
  medications: Medication[]
  careNotes: CareNote[]
}
