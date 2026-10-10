-- Discovery indexes. Location filtering uses numeric lat/lng (Haversine).
-- Replace with GIST on geography(Point) when PostGIS is enabled.
CREATE INDEX IF NOT EXISTS providers_search_active_city_idx ON providers (is_active, city);
CREATE INDEX IF NOT EXISTS providers_search_district_idx ON providers (is_active, district);
CREATE INDEX IF NOT EXISTS providers_search_created_idx ON providers (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS provider_services_search_idx ON provider_services (is_active, category_id, provider_id);
CREATE INDEX IF NOT EXISTS provider_services_price_idx ON provider_services (is_active, price);
