<template>
  <div class="flex min-h-dvh flex-col bg-canvas text-default">
    <header class="pt-safe">
      <div class="mx-auto flex h-header max-w-page items-center justify-between px-4 sm:px-6">
        <AppLogo :size="34" />
        <div class="flex items-center gap-1">
          <ThemeToggle />
          <NuxtLink
            to="/"
            class="inline-flex min-h-touch items-center gap-1 rounded-md px-2 text-sm font-medium text-muted hover:text-highlighted"
          >
            <span>بازگشت</span>
            <UIcon name="i-lucide-arrow-left" class="size-4" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </header>
    <main class="flex flex-1 items-start justify-center px-4 pb-safe pt-4 sm:items-center sm:pt-0">
      <slot />
    </main>
  </div>
</template>
