<script setup lang="ts">
const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    class="fixed top-4 right-4 z-40 rounded-lg bg-gray-800 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-gray-700"
    @click="emit('click')"
  >Admin</button>
</template>
