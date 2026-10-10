<script setup lang="ts">
const { loggedIn } = useUserSession()
const year = new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(new Date().getFullYear())
</script>

<template>
  <footer class="hidden border-t border-default bg-canvas-deep md:block">
    <div class="mx-auto flex max-w-page flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
      <div class="max-w-sm">
        <AppLogo :size="32" :to="null" />
        <p class="mt-3 text-sm leading-7 text-muted">
          همراه مطمئن خانواده‌های ایرانی برای مراقبت از حیوانات خانگی؛ جستجو، رزرو، گفتگو و پرداخت در یک‌جا.
        </p>
      </div>
      <nav class="grid grid-cols-2 gap-x-12 gap-y-2 text-sm" aria-label="پیوندهای پایین صفحه">
        <NuxtLink to="/providers" class="text-toned hover:text-highlighted">ارائه‌دهندگان</NuxtLink>
        <NuxtLink to="/#how" class="text-toned hover:text-highlighted">چطور کار می‌کند</NuxtLink>
        <NuxtLink :to="loggedIn ? '/provider' : '/register'" class="text-toned hover:text-highlighted">ارائه‌دهنده شوید</NuxtLink>
        <NuxtLink :to="loggedIn ? '/report' : '/login'" class="text-toned hover:text-highlighted">گزارش تخلف</NuxtLink>
      </nav>
      <p class="text-sm text-muted">© {{ year }} پت‌یار</p>
    </div>
  </footer>
</template>
