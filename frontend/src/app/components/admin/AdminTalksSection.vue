<script setup lang="ts">
import type { Talk } from '../../../domain/talks/Talk'

defineProps<{ talks: Talk[] }>()
const emit = defineEmits<{ delete: [talk: Talk]; restore: [talk: Talk] }>()

function speakerNames(talk: Talk): string {
  return talk.speakers.map((s) => `${s.firstname} ${s.lastname}`).join(', ')
}

function confirmDelete(talk: Talk): void {
  if (confirm(`Supprimer "${talk.title ?? '(sans titre)'}" ?`)) emit('delete', talk)
}
</script>

<template>
  <ul class="divide-y divide-gray-100">
    <li v-for="talk in talks" :key="talk.id" class="flex items-center justify-between gap-4 py-2 text-sm">
      <div>
        <p class="font-medium text-gray-900">{{ talk.title ?? '(sans titre)' }}</p>
        <p class="text-gray-500">{{ talk.conference.name }} — {{ speakerNames(talk) }}</p>
      </div>
      <button
        v-if="!talk.deletedAt"
        class="shrink-0 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
        @click="confirmDelete(talk)"
      >Supprimer</button>
      <button
        v-else
        class="shrink-0 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
        @click="emit('restore', talk)"
      >Restaurer</button>
    </li>
    <li v-if="talks.length === 0" class="py-4 text-sm text-gray-400">Aucun talk.</li>
  </ul>
</template>
