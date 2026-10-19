<script setup lang="ts">
import { ref, computed } from 'vue';
import TalkListComponent from './components/list-talks/TalkListComponent.vue'
import TalkFiltersComponent from './components/list-talks/TalkFiltersComponent.vue'
import TalkDetailModal from './components/list-talks/TalkDetailModal.vue'
import { useListTalks } from './components/list-talks/UseListTalks.ts'
import { filterTalksBySpeakerName, filterTalksByCategory, getAvailableCategories } from '../domain/talks/filter/FilterTalksFunctions'
import type { Talk } from '../domain/talks/Talk'

const { talks, isLoading, error } = useListTalks()
const speakerName = ref('')
const category = ref('')
const selectedTalk = ref<Talk | null>(null)

const categories = computed(() => getAvailableCategories(talks.value))
const filteredTalks = computed(() =>
  filterTalksByCategory(filterTalksBySpeakerName(talks.value, speakerName.value), category.value),
)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="w-full px-4 py-10 md:px-8">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6">Talks Shodo</h1>

      <div v-if="isLoading" class="flex flex-col items-center gap-3 py-20 text-gray-500">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p class="text-sm">Chargement des talks… le service peut mettre jusqu'à 50 secondes à se réveiller après une période d'inactivité.</p>
      </div>

      <div v-else-if="error" class="py-20 text-center text-sm text-red-600">
        Impossible de charger les talks pour le moment. Réessaie dans quelques instants.
      </div>

      <template v-else>
        <TalkFiltersComponent v-model:speaker-name="speakerName" v-model:category="category" :categories="categories" />
        <TalkListComponent :talks="filteredTalks" @select="selectedTalk = $event" />
      </template>
    </div>
  </div>

  <TalkDetailModal v-if="selectedTalk" :talk="selectedTalk" @close="selectedTalk = null" />
</template>
