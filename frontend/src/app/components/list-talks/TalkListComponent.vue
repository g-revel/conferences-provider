<script setup lang="ts">
import type { Talk } from '../../../domain/talks/Talk'

defineProps<{ talks: Talk[] }>()

function talkKey(talk: Talk): string {
  return `${talk.conference.name}-${talk.speaker.firstname}-${talk.speaker.lastname}`
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
      — {{ talk.speaker.firstname }} {{ talk.speaker.lastname }}
      <span v-if="talk.title" class="text-gray-500"> : {{ talk.title }}</span>
    </li>
  </ul>
</template>
