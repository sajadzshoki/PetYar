export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    'nuxt-auth-utils',
  ],
  app: {
    head: {
      htmlAttrs: { lang: 'fa', dir: 'rtl' },
      title: 'پت‌یار | همراه مطمئن حیوان خانگی شما',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'پت‌یار، بازار خدمات حیوانات خانگی در ایران — واکسیناسیون، نگهداری، آرایش و مراقبت با ارائه‌دهندگان تأییدشده.' },
        { name: 'theme-color', content: '#c45c3e' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  ui: {
    colorMode: false,
  },
  runtimeConfig: {
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || '',
    },
    databaseUrl: process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL || '',
    storageDriver: process.env.STORAGE_DRIVER || 'local',
    storageLocalDir: process.env.STORAGE_LOCAL_DIR || './storage/local',
    minio: {
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: Number(process.env.MINIO_PORT || 9000),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
      bucket: process.env.MINIO_BUCKET || 'petyar',
    },
    logLevel: process.env.LOG_LEVEL || 'info',
    paymentDriver: process.env.PAYMENT_DRIVER || 'zarinpal',
    zarinpalMerchantId: process.env.ZARINPAL_MERCHANT_ID || '',
    zarinpalSandbox: process.env.ZARINPAL_SANDBOX === 'true',
    paymentPlatformFeeBps: Number(process.env.PAYMENT_PLATFORM_FEE_BPS || 1000),
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'PetYar',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      appLocale: process.env.NUXT_PUBLIC_APP_LOCALE || 'fa-IR',
    },
  },
  srcDir: 'app',
  serverDir: 'server',
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2025-07-15',
  nitro: {
    experimental: {
      openAPI: false,
    },
  },
  typescript: {
    strict: true,
    typeCheck: false,
    tsConfig: {
      include: ['../types/**/*.d.ts'],
    },
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
  fonts: {
    defaults: {
      weights: [400, 500, 600, 700],
      styles: ['normal'],
    },
  },
})
