<template>
  <div class="flex min-h-dvh flex-col bg-canvas text-default">
    <AppHeader context="provider" />
    <ProviderNav />
    <main class="flex-1 pb-nav md:pb-0">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
