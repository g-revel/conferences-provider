<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import TalkListComponent from './components/list-talks/TalkListComponent.vue'
import TalkFiltersComponent from './components/list-talks/TalkFiltersComponent.vue'
import TalkDetailModal from './components/list-talks/TalkDetailModal.vue'
import AdminAccessButton from './components/admin/AdminAccessButton.vue'
import AdminLoginModal from './components/admin/AdminLoginModal.vue'
import AdminPanel from './components/admin/AdminPanel.vue'
import { useListTalks } from './components/list-talks/UseListTalks.ts'
import {
  filterTalksBySpeakerName,
  filterTalksByCategory,
  filterTalksByCity,
  getAvailableCategories,
  getAvailableCities,
} from '../domain/talks/filter/FilterTalksFunctions'
import type { Talk } from '../domain/talks/Talk'
import { adminClientKey } from './injectionKeys'

const { talks, isLoading, error } = useListTalks()
const speakerName = ref('')
const category = ref('')
const city = ref('')
const selectedTalk = ref<Talk | null>(null)

const categories = computed(() => getAvailableCategories(talks.value))
const cities = computed(() => getAvailableCities(talks.value))
const filteredTalks = computed(() =>
  filterTalksByCity(
    filterTalksByCategory(filterTalksBySpeakerName(talks.value, speakerName.value), category.value),
    city.value,
  ),
)

const adminClient = inject(adminClientKey)!
const showLoginModal = ref(false)
const loginError = ref(false)
// Mot de passe en mémoire seulement (pas de persistance entre rechargements) :
// cohérent avec le niveau de sécurité volontairement minimal pour l'instant.
const adminPassword = ref<string | null>(null)

async function handleLoginSubmit(password: string): Promise<void> {
  const valid = await adminClient.login(password)
  if (valid) {
    adminPassword.value = password
    showLoginModal.value = false
    loginError.value = false
  } else {
    loginError.value = true
  }
}
</script>

<template>
  <AdminPanel v-if="adminPassword" :password="adminPassword" @close="adminPassword = null" />

  <template v-else>
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
          <TalkFiltersComponent
            v-model:speaker-name="speakerName"
            v-model:category="category"
            v-model:city="city"
            :categories="categories"
            :cities="cities"
          />
          <TalkListComponent :talks="filteredTalks" @select="selectedTalk = $event" />
        </template>
      </div>
    </div>

    <AdminAccessButton @click="showLoginModal = true" />
    <TalkDetailModal v-if="selectedTalk" :talk="selectedTalk" @close="selectedTalk = null" />
  </template>

  <AdminLoginModal
    v-if="showLoginModal"
    :error="loginError"
    @submit="handleLoginSubmit"
    @close="showLoginModal = false"
  />
</template>
