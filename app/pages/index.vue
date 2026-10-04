<template>
  <div>
    <section class="relative overflow-hidden">
      <div class="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
        <div>
          <p class="text-sm font-medium text-forest-700">بازار خدمات حیوانات خانگی</p>
          <h1 class="mt-3 text-4xl font-semibold leading-[1.25] tracking-tight text-ink-900 sm:text-5xl">
            مراقبت درست،
            <span class="text-terracotta-600">نزدیک شما</span>
          </h1>
          <p class="mt-5 max-w-md text-base leading-8 text-ink-600">
            پت‌یار جاییست که صاحب حیوان خانگی، ارائه‌دهندهٔ خدمات و اعتماد به هم می‌رسند.
            واکسیناسیون، نگهداری، آرایش و مراقبت — با آدم‌هایی که می‌شناسید.
          </p>
          <form class="mt-8 flex max-w-md gap-2" action="/providers" method="get">
            <UInput name="q" class="flex-1" placeholder="جستجوی خدمت یا محله" />
            <UButton type="submit" size="lg">جستجو</UButton>
          </form>
          <div class="mt-4 flex flex-wrap gap-3">
            <UButton to="/providers" size="lg" color="neutral" variant="outline">همه ارائه‌دهندگان</UButton>
          </div>
          <p class="mt-6 text-xs text-ink-500">در حال ساخت زیربنا. رزرو و پرداخت در فازهای بعد فعال می‌شود.</p>
        </div>
        <div class="relative">
          <img
            src="https://images.unsplash.com/photo-1548199973-03cce0d62f55?auto=format&fit=crop&w=1400&q=80"
            alt="دو سگ در فضای باز"
            class="h-[280px] w-full object-cover sm:h-[380px] lg:h-[460px] ring-1 ring-ink-200"
            width="1400"
            height="900"
          >
        </div>
      </div>
    </section>

    <section id="how" class="border-t border-ink-200 bg-paper">
      <div class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 class="text-2xl font-semibold">سه قدم ساده</h2>
        <ol class="mt-8 grid gap-8 sm:grid-cols-3">
          <li>
            <p class="text-sm text-terracotta-600">۰۱</p>
            <h3 class="mt-2 font-medium">حساب بسازید</h3>
            <p class="mt-2 text-sm leading-7 text-ink-600">به‌عنوان صاحب حیوان یا ارائه‌دهنده خدمات ثبت‌نام کنید.</p>
          </li>
          <li>
            <p class="text-sm text-terracotta-600">۰۲</p>
            <h3 class="mt-2 font-medium">نیازتان را مشخص کنید</h3>
            <p class="mt-2 text-sm leading-7 text-ink-600">نگهداری، بهداشت، آموزش یا مراقبت در منزل — به‌زودی.</p>
          </li>
          <li>
            <p class="text-sm text-terracotta-600">۰۳</p>
            <h3 class="mt-2 font-medium">با اطمینان بسپارید</h3>
            <p class="mt-2 text-sm leading-7 text-ink-600">تأیید هویت، نظرات و پرداخت امن در فازهای بعدی می‌آید.</p>
          </li>
        </ol>
      </div>
    </section>

    <section id="trust" class="border-t border-ink-200">
      <div class="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center">
        <img
          src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80"
          alt="گربه در خانه"
          class="h-64 w-full object-cover sm:h-80 ring-1 ring-ink-200"
          width="1200"
          height="800"
        >
        <div>
          <h2 class="text-2xl font-semibold">اعتماد، اصل ماجراست</h2>
          <p class="mt-4 text-sm leading-7 text-ink-600">
            طراحی پت‌یار برای خانواده‌های ایرانی است: واضح، گرم و بدون هیاهو.
            نقش‌ها از همین فاز مشخص‌اند — صاحب حیوان، ارائه‌دهنده، مدیر —
            تا هر قابلیت بعدی روی همین ستون بایستد.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
