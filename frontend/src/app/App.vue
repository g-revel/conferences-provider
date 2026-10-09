<script setup lang="ts">
import { ref } from 'vue';
import TalkListComponent from './components/list-talks/TalkListComponent.vue'
import { useListTalks } from './components/list-talks/UseListTalks.ts'

const toto = ref(0)
const talks = useListTalks()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-2xl mx-auto py-10 px-4">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6">Talks Shodo</h1>
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <TalkListComponent :talks="talks" />
      </div>
    </div>
  </div>

  <button
    class="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    @click="toto++"
    >
    ici : {{ toto }}
    </button>
</template>
