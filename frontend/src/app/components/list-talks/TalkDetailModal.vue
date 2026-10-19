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
        <h2 class="font-display text-xl font-extrabold tracking-tight text-shodo-noir">{{ talk.title }}</h2>
        <button
          class="shrink-0 rounded-full p-1 text-shodo-taupe hover:bg-shodo-creme hover:text-shodo-noir"
          aria-label="Fermer"
          @click="emit('close')"
        >✕</button>
      </div>

      <p class="mt-1 text-sm text-shodo-ink">{{ speakerNames(talk) }}</p>

      <div class="mt-3 flex flex-wrap gap-2 text-xs">
        <span v-if="talk.category" class="rounded-full border border-shodo-rose px-2 py-0.5 font-bold uppercase tracking-wide text-shodo-rose">{{ talk.category }}</span>
        <span v-if="talk.format" class="rounded-full border border-shodo-marron/35 px-2 py-0.5 font-semibold text-shodo-marron">{{ talk.format }}</span>
        <span v-if="talk.level" class="rounded-full border border-shodo-marron/35 px-2 py-0.5 font-semibold text-shodo-marron">{{ talk.level }}</span>
        <span v-if="talk.language" class="rounded-full border border-shodo-marron/35 px-2 py-0.5 font-semibold text-shodo-marron">{{ talk.language }}</span>
        <span v-if="getTalkCity(talk)" class="rounded-full border border-shodo-marron/35 px-2 py-0.5 font-semibold text-shodo-marron">📍 {{ getTalkCity(talk) }}</span>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <span>
          <a
            v-if="talk.conference.url"
            :href="talk.conference.url"
            target="_blank"
            rel="noopener noreferrer"
            class="font-bold text-shodo-rose hover:underline"
          >{{ talk.conference.name }}</a>
          <span v-else class="font-bold text-shodo-taupe">{{ talk.conference.name }}</span>
          <span v-if="talk.year" class="text-shodo-taupe"> · {{ talk.year }}</span>
        </span>

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
          class="text-shodo-taupe hover:underline"
        >📑 Slides</a>
      </div>

      <p v-if="talk.description" class="mt-4 whitespace-pre-line text-sm leading-relaxed text-shodo-ink">{{ talk.description }}</p>
    </div>
  </div>
</template>
