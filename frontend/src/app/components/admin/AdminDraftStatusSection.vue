<script setup lang="ts">
import type { Talk } from '../../../domain/talks/Talk'

defineProps<{ talks: Talk[] }>()
const emit = defineEmits<{ validate: [talk: Talk]; delete: [talk: Talk] }>()

function speakerNames(talk: Talk): string {
  return talk.speakers.map((s) => `${s.firstname} ${s.lastname}`).join(', ')
}

function confirmDelete(talk: Talk): void {
  if (confirm(`Supprimer "${talk.title ?? '(sans titre)'}" ?`)) emit('delete', talk)
}
</script>

<template>
  <ul class="divide-y divide-shodo-marron/15">
    <li v-for="talk in talks" :key="talk.id" class="flex items-center justify-between gap-4 py-2 text-sm">
      <div>
        <p class="font-medium text-shodo-noir">{{ talk.title ?? '(sans titre)' }}</p>
        <p class="text-shodo-taupe">{{ talk.conference.name }} — {{ speakerNames(talk) }}</p>
      </div>
      <div class="flex shrink-0 gap-2">
        <button
          class="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
          @click="emit('validate', talk)"
        >Valider</button>
        <button
          class="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          @click="confirmDelete(talk)"
        >Supprimer</button>
      </div>
    </li>
    <li v-if="talks.length === 0" class="py-4 text-sm text-gray-400">Aucun talk dans cet état.</li>
  </ul>
</template>
