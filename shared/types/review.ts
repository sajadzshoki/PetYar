export interface ReviewScores {
  overall: number
  communication: number
  quality: number
  punctuality: number
  care: number
}

export interface Review extends ReviewScores {
  id: string
  bookingId: string
  providerId: string
  ownerId: string
  ownerName: string
  comment: string
  hidden: boolean
  createdAt: string
}

export interface ProviderRatingSummary extends ReviewScores {
  reviewCount: number
}

export interface FavoriteProvider {
  providerId: string
  displayName: string
  photoUrl: string | null
  city: string | null
  ratingAverage: number | null
  reviewCount: number
  createdAt: string
}
