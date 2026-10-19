<script setup lang="ts">
import type { Talk } from '../../../domain/talks/Talk'
import { getTalkCity } from '../../../domain/talks/filter/FilterTalksFunctions'

defineProps<{ talk: Talk }>()
const emit = defineEmits<{ close: [] }>()

function speakerNames(talk: Talk): string {
  return talk.speakers.map((s) => `${s.firstname} ${s.lastname}`).join(', ')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-10"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-xl font-semibold text-gray-900">{{ talk.title }}</h2>
        <button
          class="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Fermer"
          @click="emit('close')"
        >✕</button>
      </div>

      <p class="mt-1 text-sm text-gray-600">{{ speakerNames(talk) }}</p>

      <div class="mt-3 flex flex-wrap gap-2 text-xs">
        <span v-if="talk.category" class="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">{{ talk.category }}</span>
        <span v-if="talk.format" class="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">{{ talk.format }}</span>
        <span v-if="talk.level" class="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">{{ talk.level }}</span>
        <span v-if="talk.language" class="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">{{ talk.language }}</span>
        <span v-if="getTalkCity(talk)" class="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">📍 {{ getTalkCity(talk) }}</span>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <a
          v-if="talk.conference.url"
          :href="talk.conference.url"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-blue-600 hover:underline"
        >{{ talk.conference.name }}</a>
        <span v-else class="font-medium text-gray-700">{{ talk.conference.name }}</span>

        <a
          v-if="talk.videoUrl"
          :href="talk.videoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-red-600 hover:underline"
        >▶ Vidéo</a>

        <a
          v-if="talk.slidesUrl"
          :href="talk.slidesUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-gray-600 hover:underline"
        >📑 Slides</a>
      </div>

      <p v-if="talk.description" class="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-700">{{ talk.description }}</p>
    </div>
  </div>
</template>
