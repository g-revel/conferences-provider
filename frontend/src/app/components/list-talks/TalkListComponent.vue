<script setup lang="ts">
import type { Talk } from '../../../domain/talks/Talk'
import { getTalkCity } from '../../../domain/talks/filter/FilterTalksFunctions'

defineProps<{ talks: Talk[] }>()
const emit = defineEmits<{
  select: [talk: Talk]
  filterSpeaker: [name: string]
  filterCategory: [category: string]
}>()

// Le titre doit faire partie de la clé : un même speaker donne souvent plusieurs
// talks différents à la même conférence (ex. Julien Topcu à Devoxx France), donc
// conférence + speakers seuls ne sont pas uniques — une clé dupliquée casse le
// rendu de la liste dès qu'elle se re-rend (filtre), Vue réutilisant à tort le
// même nœud DOM pour des talks différents.
function talkKey(talk: Talk): string {
  return [talk.conference.name, talk.title, ...talk.speakers.map((s) => `${s.firstname}-${s.lastname}`)].join('-')
}
</script>

<template>
  <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <li
      v-for="talk in talks"
      :key="talkKey(talk)"
      class="flex cursor-pointer flex-col gap-2 rounded-xl border border-shodo-marron/15 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      @click="emit('select', talk)"
    >
      <div class="flex flex-wrap gap-1">
        <button
          v-for="category in talk.categories"
          :key="category"
          type="button"
          class="self-start rounded-full border border-shodo-rose px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-shodo-rose hover:bg-shodo-rose/10"
          @click.stop="emit('filterCategory', category)"
        >{{ category }}</button>
        <span
          v-if="getTalkCity(talk)"
          class="self-start rounded-full border border-shodo-marron/35 px-2 py-0.5 text-[10px] font-semibold text-shodo-marron"
        >📍 {{ getTalkCity(talk) }}</span>
      </div>

      <h2 v-if="talk.title" class="font-display font-extrabold tracking-tight text-shodo-noir">{{ talk.title }}</h2>

      <p class="text-sm text-shodo-ink">
        <template v-for="(speaker, index) in talk.speakers" :key="`${speaker.firstname}-${speaker.lastname}`">
          <button type="button" class="hover:underline" @click.stop="emit('filterSpeaker', `${speaker.firstname} ${speaker.lastname}`)">{{ speaker.firstname }} {{ speaker.lastname }}</button><span v-if="index < talk.speakers.length - 1">, </span>
        </template>
      </p>

      <div class="mt-auto flex items-center justify-between gap-2 pt-2 text-sm">
        <span class="min-w-0">
          <a
            v-if="talk.conference.url"
            :href="talk.conference.url"
            target="_blank"
            rel="noopener noreferrer"
            class="font-bold text-shodo-rose hover:underline"
            @click.stop
          >{{ talk.conference.name }}</a>
          <span v-else class="font-bold text-shodo-taupe">{{ talk.conference.name }}</span>
          <span v-if="talk.year" class="text-shodo-taupe"> · {{ talk.year }}</span>
        </span>

        <a
          v-if="talk.videoUrl"
          :href="talk.videoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="whitespace-nowrap text-red-600 hover:underline"
          @click.stop
        >🔗 Voir le talk</a>
      </div>
    </li>
  </ul>
</template>
