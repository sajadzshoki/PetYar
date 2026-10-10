import type { PricingType } from '../constants/providers'
import type { SearchSort, SearchView } from '../constants/search'

export interface ProviderSearchHit {
  id: string
  displayName: string
  photoUrl: string | null
  city: string | null
  district: string | null
  serviceArea: string | null
  experienceYears: number | null
  minPrice: number | null
  serviceTitles: string[]
  distanceKm: number | null
  ratingAverage: number | null
  reviewCount: number
}

export interface ServiceSearchHit {
  id: string
  title: string
  description: string | null
  categoryName: string
  pricingType: PricingType
  price: number | null
  durationMinutes: number | null
  providerId: string
  providerName: string
  photoUrl: string | null
  city: string | null
  district: string | null
  distanceKm: number | null
}

export interface SearchPage<T> {
  view: SearchView
  sort: SearchSort
  page: number
  pageSize: number
  total: number
  totalPages: number
  items: T[]
}

export interface SearchFacets {
  cities: string[]
  districts: string[]
}
