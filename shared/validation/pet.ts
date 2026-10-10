import { z } from 'zod'
import { PET_GENDERS, PET_TYPES } from '../constants/pets'

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''))

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ نامعتبر است')
  .optional()
  .or(z.literal(''))

export const petWriteSchema = z.object({
  name: z.string().trim().min(1, 'نام حیوان الزامی است').max(80),
  type: z.enum(PET_TYPES, { required_error: 'نوع حیوان را انتخاب کنید' }),
  breed: optionalText(80),
  gender: z.enum(PET_GENDERS).default('UNKNOWN'),
  birthDate: dateString,
  weightKg: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined || value === '') return null
      const n = typeof value === 'number' ? value : Number(value)
      return Number.isFinite(n) ? n : null
    })
    .refine(value => value === null || (value > 0 && value <= 200), 'وزن نامعتبر است'),
  behaviorNotes: optionalText(2000),
  allergies: optionalText(2000),
  medicalNotes: optionalText(2000),
  neutered: z.boolean().default(false),
})

export const vaccinationWriteSchema = z.object({
  name: z.string().trim().min(1, 'نام واکسن الزامی است').max(120),
  administeredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ تزریق نامعتبر است'),
  nextDueOn: dateString,
  notes: optionalText(1000),
})

export const medicationWriteSchema = z.object({
  name: z.string().trim().min(1, 'نام دارو الزامی است').max(120),
  dosage: optionalText(80),
  frequency: optionalText(80),
  startedOn: dateString,
  endedOn: dateString,
  notes: optionalText(1000),
})

export const careNoteWriteSchema = z.object({
  body: z.string().trim().min(1, 'متن یادداشت الزامی است').max(4000),
})

export const uuidParamSchema = z.string().uuid('شناسه نامعتبر است')

export type PetWriteInput = z.output<typeof petWriteSchema>
export type VaccinationWriteInput = z.infer<typeof vaccinationWriteSchema>
export type MedicationWriteInput = z.infer<typeof medicationWriteSchema>
export type CareNoteWriteInput = z.infer<typeof careNoteWriteSchema>
