<script setup lang="ts">
import type { Talk } from '../../../domain/talks/Talk'

defineProps<{ talks: Talk[] }>()

// Le titre doit faire partie de la clé : un même speaker donne souvent plusieurs
// talks différents à la même conférence (ex. Julien Topcu à Devoxx France), donc
// conférence + speakers seuls ne sont pas uniques — une clé dupliquée casse le
// rendu de la liste dès qu'elle se re-rend (filtre), Vue réutilisant à tort le
// même nœud DOM pour des talks différents.
function talkKey(talk: Talk): string {
  return [talk.conference.name, talk.title, ...talk.speakers.map((s) => `${s.firstname}-${s.lastname}`)].join('-')
}

function speakerNames(talk: Talk): string {
  return talk.speakers.map((s) => `${s.firstname} ${s.lastname}`).join(', ')
}
</script>

<template>
  <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <li
      v-for="talk in talks"
      :key="talkKey(talk)"
      class="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <span
        v-if="talk.category"
        class="self-start rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
      >{{ talk.category }}</span>

      <h2 v-if="talk.title" class="font-semibold text-gray-900">{{ talk.title }}</h2>

      <p class="text-sm text-gray-600">{{ speakerNames(talk) }}</p>

      <div class="mt-auto flex items-center justify-between gap-2 pt-2 text-sm">
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
          class="whitespace-nowrap text-red-600 hover:underline"
        >▶ Vidéo</a>
      </div>
    </li>
  </ul>
</template>
