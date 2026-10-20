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
  filterTalksBySearchTerm,
  filterTalksByCategory,
  filterTalksByCity,
  filterCurrentMembersTalks,
  filterFormerMembersTalks,
  getAvailableCategories,
  getAvailableCities,
} from '../domain/talks/filter/FilterTalksFunctions'
import type { Talk } from '../domain/talks/Talk'
import { adminClientKey } from './injectionKeys'

const { talks, isLoading, error } = useListTalks()
const searchTerm = ref('')
const category = ref('')
const city = ref('')
const selectedTalk = ref<Talk | null>(null)

const categories = computed(() => getAvailableCategories(talks.value))
const cities = computed(() => getAvailableCities(talks.value))
const filteredTalks = computed(() =>
  filterTalksByCity(
    filterTalksByCategory(filterTalksBySearchTerm(talks.value, searchTerm.value), category.value),
    city.value,
  ),
)
// Un talk donné uniquement par des membres partis de Shodo s'affiche à part plutôt
// que de disparaître : reste consultable, mais ne pollue pas la liste principale.
const currentMembersTalks = computed(() => filterCurrentMembersTalks(filteredTalks.value))
const formerMembersTalks = computed(() => filterFormerMembersTalks(filteredTalks.value))

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
    <div class="min-h-screen bg-shodo-creme font-sans">
      <header class="bg-shodo-noir text-shodo-creme">
        <div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-6 md:px-8">
          <img src="/shodo-logo.svg" alt="Shodo" class="h-9 w-9 rounded-md" />
          <h1 class="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
            Talks <span class="text-shodo-rose">Shodo</span>
          </h1>
        </div>
      </header>

      <div class="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        <div v-if="isLoading" class="flex flex-col items-center gap-3 py-20 text-shodo-taupe">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-shodo-creme-watermark border-t-shodo-rose"></div>
          <p class="text-sm">Chargement des talks… le service peut mettre jusqu'à 50 secondes à se réveiller après une période d'inactivité.</p>
        </div>

        <div v-else-if="error" class="py-20 text-center text-sm font-medium text-shodo-rose">
          Impossible de charger les talks pour le moment. Réessaie dans quelques instants.
        </div>

        <template v-else>
          <TalkFiltersComponent
            v-model:search-term="searchTerm"
            v-model:category="category"
            v-model:city="city"
            :categories="categories"
            :cities="cities"
          />
          <TalkListComponent :talks="currentMembersTalks" @select="selectedTalk = $event" />

          <details v-if="formerMembersTalks.length > 0" class="mt-10">
            <summary class="cursor-pointer font-display text-sm font-extrabold uppercase tracking-widest text-shodo-taupe">
              Anciens membres de Shodo ({{ formerMembersTalks.length }})
            </summary>
            <TalkListComponent class="mt-4" :talks="formerMembersTalks" @select="selectedTalk = $event" />
          </details>
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
