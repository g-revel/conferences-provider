<script setup lang="ts">
import { reactive } from 'vue'
import type { Talk } from '../../../domain/talks/Talk'

const props = defineProps<{ talks: Talk[] }>()
const emit = defineEmits<{ setYear: [talk: Talk, year: number] }>()

// Brouillon par talk, vide tant que l'admin n'a pas saisi d'année (ces talks
// n'en ont par définition aucune — voir backend/src/routes/talks.ts).
const drafts = reactive<Record<string, string>>({})
for (const talk of props.talks) {
  if (talk.id) drafts[talk.id] = ''
}

function speakerNames(talk: Talk): string {
  return talk.speakers.map((s) => `${s.firstname} ${s.lastname}`).join(', ')
}

function onSave(talk: Talk): void {
  if (!talk.id) return
  const year = Number(drafts[talk.id])
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return
  emit('setYear', talk, year)
}
</script>

<template>
  <ul class="divide-y divide-shodo-marron/15">
    <li v-for="talk in talks" :key="talk.id" class="flex flex-col gap-2 py-3 text-sm">
      <div>
        <p class="font-medium text-shodo-noir">{{ talk.title ?? '(sans titre)' }}</p>
        <p class="text-shodo-taupe">{{ talk.conference.name }} — {{ speakerNames(talk) }}</p>
      </div>

      <div class="flex items-center gap-2">
        <input
          v-if="talk.id"
          v-model="drafts[talk.id]"
          type="number"
          placeholder="Année (ex. 2025)"
          class="w-32 rounded border border-shodo-marron/30 px-2 py-1 text-sm"
        />
        <button
          class="shrink-0 rounded bg-shodo-rose/10 px-2 py-1 text-xs font-medium text-shodo-rose hover:bg-shodo-rose/20"
          @click="onSave(talk)"
        >Enregistrer</button>
      </div>
    </li>
    <li v-if="talks.length === 0" class="py-4 text-sm text-gray-400">Aucun talk sans année.</li>
  </ul>
</template>
