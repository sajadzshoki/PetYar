<template>
  <div class="flex min-h-dvh flex-col bg-canvas text-default">
    <AppHeader context="admin" />
    <AdminNav variant="strip" class="lg:hidden" />
    <div class="mx-auto flex w-full max-w-page flex-1 gap-8 px-4 py-6 sm:px-6 lg:py-8">
      <AdminNav variant="sidebar" class="hidden lg:block" />
      <main class="min-w-0 flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
