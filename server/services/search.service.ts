import { sql, type SQL } from 'drizzle-orm'
import { getDb } from '../db/client'
import { mediaUrl } from '../utils/media'
import { DEFAULT_NEAR_RADIUS_KM } from '../../shared/constants/search'
import type { ProviderSearchInput } from '../../shared/validation/search'
import type { ProviderSearchHit, SearchFacets, SearchPage, ServiceSearchHit } from '../../shared/types/search'
import type { PricingType } from '../../shared/constants/providers'

/**
 * Discovery search uses lat/lng numeric columns + Haversine (km).
 * Swap this fragment for PostGIS ST_DWithin(geography) when maps land.
 */
function distanceSql(lat: number, lng: number) {
  return sql`(
    6371 * 2 * ASIN(SQRT(
      POWER(SIN(RADIANS((${lat} - p.latitude::double precision) / 2)), 2)
      + COS(RADIANS(${lat})) * COS(RADIANS(p.latitude::double precision))
      * POWER(SIN(RADIANS((${lng} - p.longitude::double precision) / 2)), 2)
    ))
  )`
}

function ilike(term: string) {
  return `%${term.replace(/[%_\\]/g, ch => `\\${ch}`)}%`
}

function num(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function asStringArray(value: unknown): string[] {
  let parsed: unknown = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    }
    catch {
      return []
    }
  }
  if (!Array.isArray(parsed)) return []
  return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0)
}

export const searchService = {
  async facets(): Promise<SearchFacets> {
    const db = getDb()
    const cityRows = await db.execute(sql`
      SELECT DISTINCT city AS value
      FROM providers
      WHERE is_active = true AND city IS NOT NULL AND city <> ''
      ORDER BY city
      LIMIT 100
    `)
    const districtRows = await db.execute(sql`
      SELECT DISTINCT district AS value
      FROM providers
      WHERE is_active = true AND district IS NOT NULL AND district <> ''
      ORDER BY district
      LIMIT 100
    `)
    return {
      cities: cityRows.map(r => String((r as { value: string }).value)),
      districts: districtRows.map(r => String((r as { value: string }).value)),
    }
  },

  async search(input: ProviderSearchInput): Promise<SearchPage<ProviderSearchHit> | SearchPage<ServiceSearchHit>> {
    if (input.view === 'services') {
      return this.searchServices(input)
    }
    return this.searchProviders(input)
  },

  async searchProviders(input: ProviderSearchInput): Promise<SearchPage<ProviderSearchHit>> {
    const db = getDb()
    const where = this.providerWhere(input)
    const dist = input.lat !== undefined && input.lng !== undefined ? distanceSql(input.lat, input.lng) : sql`NULL`
    const order = this.providerOrder(input, dist)
    const offset = (input.page - 1) * input.pageSize

    const countRows = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM providers p
      WHERE ${where}
    `)
    const total = Number((countRows[0] as { total: number } | undefined)?.total || 0)
    const totalPages = Math.max(1, Math.ceil(total / input.pageSize))

    const rows = await db.execute(sql`
      SELECT
        p.id,
        p.display_name,
        p.photo_key,
        p.city,
        p.district,
        p.service_area,
        p.experience_years,
        (
          SELECT MIN(s.price::double precision)
          FROM provider_services s
          WHERE s.provider_id = p.id AND s.is_active = true AND s.price IS NOT NULL
        ) AS min_price,
        (
          SELECT COALESCE(json_agg(s.title ORDER BY s.created_at DESC), '[]'::json)
          FROM (
            SELECT title, created_at
            FROM provider_services
            WHERE provider_id = p.id AND is_active = true
            ORDER BY created_at DESC
            LIMIT 3
          ) s
        ) AS service_titles,
        ${dist} AS distance_km
      FROM providers p
      WHERE ${where}
      ORDER BY ${order}
      LIMIT ${input.pageSize} OFFSET ${offset}
    `)

    const items: ProviderSearchHit[] = rows.map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: String(r.id),
        displayName: String(r.display_name),
        photoUrl: mediaUrl(r.photo_key as string | null),
        city: (r.city as string | null) ?? null,
        district: (r.district as string | null) ?? null,
        serviceArea: (r.service_area as string | null) ?? null,
        experienceYears: r.experience_years == null ? null : Number(r.experience_years),
        minPrice: num(r.min_price),
        serviceTitles: asStringArray(r.service_titles),
        distanceKm: num(r.distance_km),
      }
    })

    return {
      view: 'providers',
      sort: input.sort,
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages,
      items,
    }
  },

  async searchServices(input: ProviderSearchInput): Promise<SearchPage<ServiceSearchHit>> {
    const db = getDb()
    const where = this.serviceWhere(input)
    const dist = input.lat !== undefined && input.lng !== undefined ? distanceSql(input.lat, input.lng) : sql`NULL`
    const order = this.serviceOrder(input, dist)
    const offset = (input.page - 1) * input.pageSize

    const countRows = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM provider_services s
      INNER JOIN providers p ON p.id = s.provider_id
      INNER JOIN service_categories c ON c.id = s.category_id
      WHERE ${where}
    `)
    const total = Number((countRows[0] as { total: number } | undefined)?.total || 0)
    const totalPages = Math.max(1, Math.ceil(total / input.pageSize))

    const rows = await db.execute(sql`
      SELECT
        s.id,
        s.title,
        s.description,
        c.name AS category_name,
        s.pricing_type,
        s.price,
        s.duration_minutes,
        p.id AS provider_id,
        p.display_name AS provider_name,
        p.photo_key,
        p.city,
        p.district,
        ${dist} AS distance_km
      FROM provider_services s
      INNER JOIN providers p ON p.id = s.provider_id
      INNER JOIN service_categories c ON c.id = s.category_id
      WHERE ${where}
      ORDER BY ${order}
      LIMIT ${input.pageSize} OFFSET ${offset}
    `)

    const items: ServiceSearchHit[] = rows.map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: String(r.id),
        title: String(r.title),
        description: (r.description as string | null) ?? null,
        categoryName: String(r.category_name),
        pricingType: r.pricing_type as PricingType,
        price: num(r.price),
        durationMinutes: r.duration_minutes == null ? null : Number(r.duration_minutes),
        providerId: String(r.provider_id),
        providerName: String(r.provider_name),
        photoUrl: mediaUrl(r.photo_key as string | null),
        city: (r.city as string | null) ?? null,
        district: (r.district as string | null) ?? null,
        distanceKm: num(r.distance_km),
      }
    })

    return {
      view: 'services',
      sort: input.sort,
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages,
      items,
    }
  },

  providerWhere(input: ProviderSearchInput) {
    const parts = [sql`p.is_active = true`]
    if (input.q) {
      const like = ilike(input.q)
      parts.push(sql`(
        p.display_name ILIKE ${like} ESCAPE '\\'
        OR COALESCE(p.bio, '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE(p.city, '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE(p.district, '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE(p.service_area, '') ILIKE ${like} ESCAPE '\\'
        OR EXISTS (
          SELECT 1 FROM provider_services s
          WHERE s.provider_id = p.id AND s.is_active = true
            AND (s.title ILIKE ${like} ESCAPE '\\' OR COALESCE(s.description, '') ILIKE ${like} ESCAPE '\\')
        )
      )`)
    }
    if (input.city) {
      parts.push(sql`p.city ILIKE ${ilike(input.city)} ESCAPE '\\'`)
    }
    if (input.district) {
      parts.push(sql`p.district ILIKE ${ilike(input.district)} ESCAPE '\\'`)
    }
    if (input.category || input.priceMin !== undefined || input.priceMax !== undefined) {
      const serviceParts = [sql`s.provider_id = p.id`, sql`s.is_active = true`]
      if (input.category) serviceParts.push(sql`s.category_id = ${input.category}::uuid`)
      if (input.priceMin !== undefined) serviceParts.push(sql`s.price IS NOT NULL AND s.price::double precision >= ${input.priceMin}`)
      if (input.priceMax !== undefined) serviceParts.push(sql`s.price IS NOT NULL AND s.price::double precision <= ${input.priceMax}`)
      parts.push(sql`EXISTS (SELECT 1 FROM provider_services s WHERE ${sql.join(serviceParts, sql` AND `)})`)
    }
    this.appendLocation(parts, input)
    return sql.join(parts, sql` AND `)
  },

  serviceWhere(input: ProviderSearchInput) {
    const parts = [sql`p.is_active = true`, sql`s.is_active = true`]
    if (input.q) {
      const like = ilike(input.q)
      parts.push(sql`(
        s.title ILIKE ${like} ESCAPE '\\'
        OR COALESCE(s.description, '') ILIKE ${like} ESCAPE '\\'
        OR p.display_name ILIKE ${like} ESCAPE '\\'
        OR COALESCE(p.city, '') ILIKE ${like} ESCAPE '\\'
      )`)
    }
    if (input.city) parts.push(sql`p.city ILIKE ${ilike(input.city)} ESCAPE '\\'`)
    if (input.district) parts.push(sql`p.district ILIKE ${ilike(input.district)} ESCAPE '\\'`)
    if (input.category) parts.push(sql`s.category_id = ${input.category}::uuid`)
    if (input.priceMin !== undefined) parts.push(sql`s.price IS NOT NULL AND s.price::double precision >= ${input.priceMin}`)
    if (input.priceMax !== undefined) parts.push(sql`s.price IS NOT NULL AND s.price::double precision <= ${input.priceMax}`)
    this.appendLocation(parts, input)
    return sql.join(parts, sql` AND `)
  },

  appendLocation(parts: SQL[], input: ProviderSearchInput) {
    if (input.lat === undefined || input.lng === undefined) return
    const radius = input.radiusKm ?? DEFAULT_NEAR_RADIUS_KM
    const dist = distanceSql(input.lat, input.lng)
    parts.push(sql`p.latitude IS NOT NULL AND p.longitude IS NOT NULL`)
    parts.push(sql`${dist} <= ${radius}`)
    parts.push(sql`(p.service_radius_km IS NULL OR ${dist} <= p.service_radius_km::double precision)`)
  },

  providerOrder(input: ProviderSearchInput, dist: ReturnType<typeof sql>) {
    switch (input.sort) {
      case 'name':
        return sql`p.display_name ASC`
      case 'price_asc':
        return sql`min_price ASC NULLS LAST, p.created_at DESC`
      case 'price_desc':
        return sql`min_price DESC NULLS LAST, p.created_at DESC`
      case 'experience':
        return sql`p.experience_years DESC NULLS LAST, p.created_at DESC`
      case 'distance':
        return sql`${dist} ASC NULLS LAST, p.created_at DESC`
      default:
        return sql`p.created_at DESC`
    }
  },

  serviceOrder(input: ProviderSearchInput, dist: ReturnType<typeof sql>) {
    switch (input.sort) {
      case 'name':
        return sql`s.title ASC`
      case 'price_asc':
        return sql`s.price::double precision ASC NULLS LAST, s.created_at DESC`
      case 'price_desc':
        return sql`s.price::double precision DESC NULLS LAST, s.created_at DESC`
      case 'experience':
        return sql`p.experience_years DESC NULLS LAST, s.created_at DESC`
      case 'distance':
        return sql`${dist} ASC NULLS LAST, s.created_at DESC`
      default:
        return sql`s.created_at DESC`
    }
  },
}
