<script setup lang="ts">
const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    class="fixed top-4 right-4 z-40 rounded-lg bg-shodo-noir px-3 py-1.5 text-sm font-medium text-shodo-creme shadow hover:bg-shodo-ink"
    @click="emit('click')"
  >Admin</button>
</template>
