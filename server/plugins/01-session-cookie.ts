function requestIsHttps(event: { node?: { req?: { headers?: Record<string, string | string[] | undefined>, socket?: { encrypted?: boolean } } } }) {
  const header = event.node?.req?.headers?.['x-forwarded-proto']
  const forwarded = Array.isArray(header) ? header[0] : header
  if (forwarded) {
    const proto = forwarded.split(',')[0]?.trim().toLowerCase()
    return proto === 'https'
  }
  return event.node?.req?.socket?.encrypted === true
}

function applySecureFlag(cookie: string, secure: boolean) {
  const parts = cookie.split(';').map(part => part.trim()).filter(Boolean)
  const rest = parts.filter(part => part.toLowerCase() !== 'secure')
  if (secure)
    rest.push('Secure')
  return rest.join('; ')
}

function rewriteCookieHeader(value: unknown, secure: boolean) {
  if (Array.isArray(value))
    return value.map(item => applySecureFlag(String(item), secure))
  return applySecureFlag(String(value), secure)
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const res = event.node?.res as {
      setHeader?: (name: string, value: unknown) => unknown
      appendHeader?: (name: string, value: unknown) => unknown
    } | undefined
    if (!res?.setHeader)
      return
    const secure = requestIsHttps(event)
    const setHeader = res.setHeader.bind(res)
    const appendHeader = res.appendHeader?.bind(res)
    res.setHeader = (name, value) => {
      if (String(name).toLowerCase() === 'set-cookie')
        return setHeader(name, rewriteCookieHeader(value, secure))
      return setHeader(name, value)
    }
    if (appendHeader) {
      res.appendHeader = (name, value) => {
        if (String(name).toLowerCase() === 'set-cookie')
          return appendHeader(name, applySecureFlag(String(value), secure))
        return appendHeader(name, value)
      }
    }
  })
})
