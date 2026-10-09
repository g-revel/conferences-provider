<script setup lang="ts">
import type { Talk } from '../../../domain/talks/Talk'

defineProps<{ talks: Talk[] }>()

function talkKey(talk: Talk): string {
  return [talk.conference.name, ...talk.speakers.map((s) => `${s.firstname}-${s.lastname}`)].join('-')
}

function speakerNames(talk: Talk): string {
  return talk.speakers.map((s) => `${s.firstname} ${s.lastname}`).join(', ')
}
</script>

<template>
  <ul class="divide-y divide-gray-100">
    <li
      v-for="talk in talks"
      :key="talkKey(talk)"
      class="py-3 px-4 text-gray-800"
    >
      <a
        v-if="talk.conference.url"
        :href="talk.conference.url"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-blue-600 hover:underline"
      >{{ talk.conference.name }}</a>
      <span v-else class="font-medium">{{ talk.conference.name }}</span>
      — {{ speakerNames(talk) }}
      <span v-if="talk.title" class="text-gray-500"> : {{ talk.title }}</span>
      <a
        v-if="talk.videoUrl"
        :href="talk.videoUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="ml-2 text-red-600 hover:underline whitespace-nowrap"
      >▶ Vidéo</a>
    </li>
  </ul>
</template>
