export function flattenQuery(query: Record<string, unknown>): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      const first = value[0]
      out[key] = first == null ? undefined : String(first)
    }
    else if (value == null || value === '') {
      out[key] = undefined
    }
    else {
      out[key] = String(value)
    }
  }
  return out
}
