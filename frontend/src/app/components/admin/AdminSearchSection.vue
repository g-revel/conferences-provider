<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, inject } from 'vue'
import type { Talker } from '../../../domain/admin/Talker'
import type { Talk } from '../../../domain/talks/Talk'
import type { Conference } from '../../../domain/conferences/Conference'
import type { SearchStatus } from '../../../infrastructure/IAdminClient'
import { adminClientKey } from '../../injectionKeys'

const props = defineProps<{ talkers: Talker[]; password: string }>()
const emit = defineEmits<{ accepted: [] }>()

const client = inject(adminClientKey)!

interface CandidateRow {
  localKey: number
  talk: Talk
}

const mode = ref<'talker' | 'event'>('talker')
const selectedTalker = ref<Talker | null>(null)
const selectedConferenceName = ref('')
const conferences = ref<Conference[]>([])
const status = ref<SearchStatus | null>(null)
const searching = ref(false)
const hasSearched = ref(false)
const elapsedSeconds = ref(0)
const candidates = ref<CandidateRow[]>([])
const error = ref<string | null>(null)
const acceptingKeys = ref(new Set<number>())
let nextLocalKey = 0
let elapsedTimer: ReturnType<typeof setInterval> | undefined

function speakerNames(talk: Talk): string {
  return talk.speakers.map((s) => `${s.firstname} ${s.lastname}`).join(', ')
}

const canSearch = computed(() =>
  mode.value === 'talker' ? selectedTalker.value !== null : selectedConferenceName.value !== '',
)

onMounted(async () => {
  status.value = await client.getSearchStatus(props.password).catch(() => null)
  conferences.value = await client.getSearchConferences(props.password).catch(() => [])
})

onBeforeUnmount(() => {
  if (elapsedTimer) clearInterval(elapsedTimer)
})

async function runSearch(): Promise<void> {
  error.value = null
  candidates.value = []
  hasSearched.value = false
  searching.value = true
  elapsedSeconds.value = 0
  elapsedTimer = setInterval(() => {
    elapsedSeconds.value++
  }, 1000)

  try {
    const found =
      mode.value === 'talker'
        ? await client.searchTalker(props.password, selectedTalker.value!.firstname, selectedTalker.value!.lastname)
        : await client.searchEvent(props.password, selectedConferenceName.value)
    candidates.value = found.map((talk) => ({ localKey: nextLocalKey++, talk }))
    hasSearched.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'La recherche a échoué.'
  } finally {
    searching.value = false
    if (elapsedTimer) clearInterval(elapsedTimer)
  }
}

function reject(localKey: number): void {
  candidates.value = candidates.value.filter((c) => c.localKey !== localKey)
}

async function accept(row: CandidateRow): Promise<void> {
  acceptingKeys.value.add(row.localKey)
  try {
    await client.acceptSearchResult(props.password, row.talk)
    candidates.value = candidates.value.filter((c) => c.localKey !== row.localKey)
    emit('accepted')
  } catch {
    error.value = "L'acceptation a échoué."
  } finally {
    acceptingKeys.value.delete(row.localKey)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="status && (!status.searxng || !status.ollama)"
      class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
    >
      <p class="font-medium">Recherche indisponible localement :</p>
      <ul class="mt-1 list-disc pl-5">
        <li v-if="!status.searxng">SearXNG ne répond pas — lance <code>docker compose up -d</code> dans <code>backend/searxng/</code>.</li>
        <li v-if="!status.ollama">Ollama ne répond pas — lance <code>ollama serve</code> (ou vérifie qu'il tourne).</li>
      </ul>
      <p class="mt-1 text-xs">Voir <code>backend/SETUP.md</code> pour l'installation complète.</p>
    </div>

    <div class="flex flex-wrap items-end gap-3">
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm font-medium"
          :class="mode === 'talker' ? 'bg-shodo-rose text-white' : 'bg-shodo-creme text-shodo-taupe'"
          @click="mode = 'talker'"
        >Par talker</button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm font-medium"
          :class="mode === 'event' ? 'bg-shodo-rose text-white' : 'bg-shodo-creme text-shodo-taupe'"
          @click="mode = 'event'"
        >Par événement</button>
      </div>

      <div v-if="mode === 'talker'" class="min-w-48 flex-1">
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-shodo-taupe">Talker</label>
        <select v-model="selectedTalker" class="w-full rounded border border-shodo-marron/30 px-2 py-1.5 text-sm">
          <option :value="null" disabled>Choisir...</option>
          <option v-for="t in talkers" :key="`${t.firstname}|${t.lastname}`" :value="t">{{ t.firstname }} {{ t.lastname }}</option>
        </select>
      </div>
      <div v-else class="min-w-48 flex-1">
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-shodo-taupe">Événement</label>
        <select v-model="selectedConferenceName" class="w-full rounded border border-shodo-marron/30 px-2 py-1.5 text-sm">
          <option value="" disabled>Choisir...</option>
          <option v-for="c in conferences" :key="c.name" :value="c.name">{{ c.name }}</option>
        </select>
      </div>

      <button
        type="button"
        class="rounded-lg bg-shodo-rose px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        :disabled="searching || !canSearch"
        @click="runSearch"
      >Lancer la recherche</button>
    </div>

    <div
      v-if="searching"
      class="flex flex-col items-center gap-3 rounded-xl border border-shodo-marron/15 bg-white py-10 text-shodo-taupe"
    >
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-shodo-creme-watermark border-t-shodo-rose"></div>
      <p class="text-sm font-medium">Recherche en cours… {{ elapsedSeconds }}s</p>
      <p class="max-w-sm text-center text-xs">Ça peut prendre plusieurs minutes selon le nombre de vidéos trouvées — ne ferme pas cet onglet.</p>
    </div>

    <p v-if="error" class="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div v-if="!searching && hasSearched">
      <p v-if="candidates.length === 0" class="text-sm text-gray-400">Aucun nouveau talk trouvé.</p>
      <ul v-else class="divide-y divide-shodo-marron/15">
        <li v-for="row in candidates" :key="row.localKey" class="flex items-center justify-between gap-4 py-3 text-sm">
          <div>
            <p class="font-medium text-shodo-noir">{{ row.talk.title ?? '(sans titre)' }}</p>
            <p class="text-shodo-taupe">{{ row.talk.conference.name }} — {{ speakerNames(row.talk) }}</p>
            <a
              v-if="row.talk.videoUrl"
              :href="row.talk.videoUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-shodo-rose hover:underline"
            >{{ row.talk.videoUrl }}</a>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              class="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
              :disabled="acceptingKeys.has(row.localKey)"
              @click="accept(row)"
            ><span v-if="acceptingKeys.has(row.localKey)" class="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]"></span>Accepter</button>
            <button
              type="button"
              class="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
              @click="reject(row.localKey)"
            >Rejeter</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
