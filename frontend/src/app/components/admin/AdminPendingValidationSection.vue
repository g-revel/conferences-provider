<script setup lang="ts">
import { reactive } from 'vue'
import type { Talk } from '../../../domain/talks/Talk'

const props = defineProps<{ talks: Talk[] }>()
const emit = defineEmits<{
  validate: [talk: Talk, videoUrl: string]
  toggleShowWithoutLink: [talk: Talk, show: boolean]
  toggleShowWithoutYear: [talk: Talk, show: boolean]
  delete: [talk: Talk]
}>()

// Un brouillon par talk, pré-rempli avec le lien candidat trouvé automatiquement
// s'il y en a un — l'admin peut le corriger avant de valider, ou en saisir un de
// zéro quand aucun candidat n'a été trouvé.
const drafts = reactive<Record<string, string>>({})
for (const talk of props.talks) {
  if (talk.id) drafts[talk.id] = talk.pendingVideoUrl ?? ''
}

function speakerNames(talk: Talk): string {
  return talk.speakers.map((s) => `${s.firstname} ${s.lastname}`).join(', ')
}

function onValidate(talk: Talk): void {
  if (!talk.id) return
  const videoUrl = drafts[talk.id]?.trim()
  if (!videoUrl) return
  emit('validate', talk, videoUrl)
}

function onDelete(talk: Talk): void {
  if (confirm(`Supprimer "${talk.title ?? '(sans titre)'}" ?`)) emit('delete', talk)
}
</script>

<template>
  <ul class="divide-y divide-shodo-marron/15">
    <li v-for="talk in talks" :key="talk.id" class="flex flex-col gap-2 py-3 text-sm">
      <div>
        <p class="font-medium text-shodo-noir">{{ talk.title ?? '(sans titre)' }}</p>
        <p class="text-shodo-taupe">{{ talk.conference.name }} — {{ speakerNames(talk) }}</p>
      </div>

      <p v-if="talk.pendingVideoUrl" class="text-xs text-shodo-taupe">
        Lien proposé :
        <a :href="talk.pendingVideoUrl" target="_blank" rel="noopener noreferrer" class="text-shodo-rose hover:underline">{{ talk.pendingVideoUrl }}</a>
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <input
          v-if="talk.id"
          v-model="drafts[talk.id]"
          type="text"
          placeholder="Lien (vidéo ou page de la conf)"
          class="min-w-0 flex-1 rounded border border-shodo-marron/30 px-2 py-1 text-sm"
        />
        <button
          class="shrink-0 rounded bg-shodo-rose/10 px-2 py-1 text-xs font-medium text-shodo-rose hover:bg-shodo-rose/20"
          @click="onValidate(talk)"
        >Valider</button>
        <button
          class="shrink-0 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          @click="onDelete(talk)"
        >Supprimer</button>

        <div class="ml-auto flex shrink-0 items-center gap-3">
          <label class="flex items-center gap-1 text-xs text-shodo-taupe">
            <input
              type="checkbox"
              :checked="talk.showWithoutLink === true"
              @change="emit('toggleShowWithoutLink', talk, ($event.target as HTMLInputElement).checked)"
            />
            Montrer le talk sans lien
          </label>

          <!-- Un talk sans lien n'apparaît pas dans "Non datés" (qui exige un lien
          pour y retrouver la date) — s'il manque aussi l'année, c'est ici l'unique
          endroit pour le marquer "à montrer quand même", sinon "montrer sans lien"
          seul ne suffirait pas à le rendre visible (voir src/routes/talks.ts : les
          deux conditions, lien et année, sont requises indépendamment). -->
          <label v-if="talk.year == null" class="flex items-center gap-1 text-xs text-shodo-taupe">
            <input
              type="checkbox"
              :checked="talk.showWithoutYear === true"
              @change="emit('toggleShowWithoutYear', talk, ($event.target as HTMLInputElement).checked)"
            />
            Montrer le talk sans date
          </label>
        </div>
      </div>
    </li>
    <li v-if="talks.length === 0" class="py-4 text-sm text-gray-400">Aucun talk en attente de validation.</li>
  </ul>
</template>
