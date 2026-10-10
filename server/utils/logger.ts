type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function currentLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL || 'info').toLowerCase()
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw
  }
  return 'info'
}

function write(level: LogLevel, message: string, extra?: unknown) {
  if (ORDER[level] < ORDER[currentLevel()]) return
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(extra !== undefined ? { extra } : {}),
  }
  const line = JSON.stringify(payload)
  if (level === 'error') {
    console.error(line)
  }
  else if (level === 'warn') {
    console.warn(line)
  }
  else {
    console.info(line)
  }
}

export const logger = {
  debug: (message: string, extra?: unknown) => write('debug', message, extra),
  info: (message: string, extra?: unknown) => write('info', message, extra),
  warn: (message: string, extra?: unknown) => write('warn', message, extra),
  error: (message: string, extra?: unknown) => write('error', message, extra),
}
