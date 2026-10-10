import type { PricingType, ServiceCategorySlug } from '../constants/providers'
import type { ProviderRatingSummary } from './review'

export interface ServiceCategory {
  id: string
  slug: ServiceCategorySlug | string
  name: string
  sortOrder: number
}

export interface ProviderGalleryItem {
  id: string
  imageUrl: string
}

export interface ProviderService {
  id: string
  categoryId: string
  categoryName: string
  title: string
  description: string | null
  pricingType: PricingType
  price: number | null
  durationMinutes: number | null
  capacity: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProviderProfile {
  id: string
  userId: string
  displayName: string
  bio: string | null
  experienceYears: number | null
  experience: string | null
  photoUrl: string | null
  gallery: ProviderGalleryItem[]
  serviceArea: string | null
  city: string | null
  district: string | null
  latitude: number | null
  longitude: number | null
  serviceRadiusKm: number | null
  isActive: boolean
  verificationStatus: string
  verified: boolean
  createdAt: string
  updatedAt: string
}

export interface PublicProvider extends ProviderProfile {
  services: ProviderService[]
  rating: ProviderRatingSummary
  favorited: boolean
}
