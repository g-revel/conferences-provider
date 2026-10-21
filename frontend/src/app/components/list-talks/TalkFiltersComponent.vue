<script setup lang="ts">
defineProps<{ categories: string[]; cities: string[] }>()

const searchTerm = defineModel<string>('searchTerm', { required: true })
const category = defineModel<string>('category', { required: true })
const city = defineModel<string>('city', { required: true })
</script>

<template>
  <div class="mb-6 flex flex-col gap-3 sm:flex-row">
    <div class="flex-1">
      <div class="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-shodo-rose">Recherche</div>
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Rechercher un talk, un speaker, une conférence..."
        class="w-full rounded-lg border border-shodo-marron/30 px-3 py-2 text-sm text-shodo-ink focus:outline-none focus:ring-2 focus:ring-shodo-rose"
      />
    </div>
    <div>
      <div class="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-shodo-rose">Catégorie</div>
      <div class="relative">
        <select
          v-model="category"
          class="appearance-none rounded-lg border border-shodo-marron/30 bg-white py-2 pr-8 pl-3 text-sm text-shodo-ink focus:outline-none focus:ring-2 focus:ring-shodo-rose"
        >
          <option value="">Toutes les catégories</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-shodo-marron/60">▾</span>
      </div>
    </div>
    <div>
      <div class="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-shodo-rose">Ville</div>
      <div class="relative">
        <select
          v-model="city"
          class="appearance-none rounded-lg border border-shodo-marron/30 bg-white py-2 pr-8 pl-3 text-sm text-shodo-ink focus:outline-none focus:ring-2 focus:ring-shodo-rose"
        >
          <option value="">Toutes les villes</option>
          <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
        </select>
        <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-shodo-marron/60">▾</span>
      </div>
    </div>
  </div>
</template>
