<template>
  <div class="min-h-dvh flex flex-col bg-canvas text-ink-900">
    <AppHeader />
    <ProviderNav />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
