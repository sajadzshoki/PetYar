import type { UserRole } from '../constants/roles'
import type {
  DisputeResolution,
  DisputeStatus,
  ReportReason,
  ReportStatus,
  ReportTargetType,
  UserStatus,
  VerificationDocumentKind,
  VerificationStatus,
} from '../constants/moderation'

export interface AdminUser {
  id: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  phone: string | null
  role: UserRole
  status: UserStatus
  createdAt: string
}

export interface VerificationDocument {
  id: string
  kind: VerificationDocumentKind
  imageUrl: string
  createdAt: string
}

export interface VerificationApplication {
  id: string
  providerId: string
  providerName: string
  userId: string
  status: VerificationStatus
  legalName: string
  nationalId: string | null
  city: string | null
  notes: string | null
  reviewNote: string | null
  submittedAt: string | null
  reviewedAt: string | null
  documents: VerificationDocument[]
  createdAt: string
}

export interface SafetyReport {
  id: string
  reporterId: string
  reporterName: string
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  description: string
  status: ReportStatus
  resolutionNote: string | null
  createdAt: string
  resolvedAt: string | null
}

export interface BookingDispute {
  id: string
  bookingId: string
  openedByUserId: string
  openerName: string
  reason: string
  status: DisputeStatus
  previousStatus: string
  resolution: DisputeResolution | null
  adminNote: string | null
  createdAt: string
  resolvedAt: string | null
}

export interface AuditLogEntry {
  id: string
  actorId: string | null
  actorName: string
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface AdminReview {
  id: string
  bookingId: string
  providerId: string
  ownerId: string
  ownerName: string
  comment: string
  overall: number
  hidden: boolean
  createdAt: string
}
