<script setup lang="ts">
defineProps<{ categories: string[]; cities: string[] }>()

const speakerName = defineModel<string>('speakerName', { required: true })
const category = defineModel<string>('category', { required: true })
const city = defineModel<string>('city', { required: true })
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-3 mb-6">
    <input
      v-model="speakerName"
      type="text"
      placeholder="Rechercher un speaker..."
      class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <select
      v-model="category"
      class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    >
      <option value="">Toutes les catégories</option>
      <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
    </select>
    <select
      v-model="city"
      class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    >
      <option value="">Toutes les villes</option>
      <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
    </select>
  </div>
</template>
