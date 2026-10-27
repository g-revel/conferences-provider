<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { adminClientKey } from '../../injectionKeys'
import AdminTalkersSection from './AdminTalkersSection.vue'
import AdminTalksSection from './AdminTalksSection.vue'
import AdminPendingValidationSection from './AdminPendingValidationSection.vue'
import AdminUndatedSection from './AdminUndatedSection.vue'
import AdminDraftStatusSection from './AdminDraftStatusSection.vue'
import type { Talker } from '../../../domain/admin/Talker'
import type { Talk } from '../../../domain/talks/Talk'

const props = defineProps<{ password: string }>()
const emit = defineEmits<{ close: [] }>()

const client = inject(adminClientKey)!
const talkers = ref<Talker[]>([])
const talks = ref<Talk[]>([])
const cities = ref<string[]>([])
const tab = ref<string>('talkers')

const activeTalks = computed(() => talks.value.filter((t) => !t.deletedAt))
const deletedTalks = computed(() => talks.value.filter((t) => t.deletedAt))
// Un talk importé de Notion à un état ≠ "Construit" reste invisible du portail tant
// qu'un admin ne l'a pas validé (voir backend/src/routes/talks.ts) — il vit dans son
// propre onglet par état plutôt que dans "À valider"/"Non datés" tant que ce n'est pas fait.
function isUnvalidatedDraft(t: Talk): boolean {
  return t.status != null && t.validated !== true
}
// Un talk sans titre n'a pas de valeur à valider (repère interne du pipeline, voir
// backend/CLAUDE.md) ; un talk supprimé n'a pas sa place dans la file de validation.
const pendingValidationTalks = computed(() =>
  activeTalks.value.filter((t) => t.title != null && t.videoUrl == null && !isUnvalidatedDraft(t)),
)
// Un talk sans année n'est pas servi côté public (voir backend/src/routes/talks.ts)
// jusqu'à ce qu'un admin la renseigne ici. Nécessite un lien : sans lien, l'admin
// n'a aucun moyen de retrouver la date du talk pour la renseigner — ce talk reste
// uniquement dans "À valider" tant qu'il n'a pas de lien.
const undatedTalks = computed(() =>
  activeTalks.value.filter((t) => t.title != null && t.year == null && t.videoUrl != null && !isUnvalidatedDraft(t)),
)
// Groupé par état Notion littéral ("Idée", "Scopé", "En construction", ...) plutôt
// qu'un jeu fixe codé en dur : les états possibles viennent de Notion et évoluent.
const draftTalksByStatus = computed(() => {
  const groups: Record<string, Talk[]> = {}
  for (const t of activeTalks.value) {
    if (isUnvalidatedDraft(t)) (groups[t.status!] ??= []).push(t)
  }
  return groups
})

async function reload(): Promise<void> {
  talkers.value = await client.getTalkers(props.password)
  talks.value = await client.getAllTalks(props.password)
  cities.value = await client.getCities(props.password)
}

onMounted(reload)

async function onUpdateCity(talker: Talker, city: string): Promise<void> {
  await client.setTalkerCity(props.password, talker.firstname, talker.lastname, city.trim() || null)
  await reload()
}

async function onUpdateActive(talker: Talker, active: boolean): Promise<void> {
  await client.setTalkerActive(props.password, talker.firstname, talker.lastname, active)
  await reload()
}

async function onAddCity(city: string): Promise<void> {
  cities.value = await client.addCity(props.password, city)
}

async function onDeleteCity(city: string): Promise<void> {
  cities.value = await client.deleteCity(props.password, city)
}

async function onDelete(talk: Talk): Promise<void> {
  if (!talk.id) return
  await client.deleteTalk(props.password, talk.id)
  await reload()
}

async function onRestore(talk: Talk): Promise<void> {
  if (!talk.id) return
  await client.restoreTalk(props.password, talk.id)
  await reload()
}

async function onValidate(talk: Talk, videoUrl: string): Promise<void> {
  if (!talk.id) return
  await client.setTalkVideoUrl(props.password, talk.id, videoUrl)
  await reload()
}

async function onToggleShowWithoutLink(talk: Talk, show: boolean): Promise<void> {
  if (!talk.id) return
  await client.setTalkShowWithoutLink(props.password, talk.id, show)
  await reload()
}

async function onSetYear(talk: Talk, year: number): Promise<void> {
  if (!talk.id) return
  await client.setTalkYear(props.password, talk.id, year)
  await reload()
}

async function onToggleShowWithoutYear(talk: Talk, show: boolean): Promise<void> {
  if (!talk.id) return
  await client.setTalkShowWithoutYear(props.password, talk.id, show)
  await reload()
}

async function onValidateDraft(talk: Talk): Promise<void> {
  if (!talk.id) return
  await client.validateDraftTalk(props.password, talk.id)
  await reload()
}
</script>

<template>
  <div class="min-h-screen bg-shodo-creme font-sans">
    <div class="w-full px-4 py-10 md:px-8">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="font-display text-2xl font-extrabold text-shodo-noir">Admin</h1>
        <button
          class="rounded-lg bg-shodo-noir px-3 py-1.5 text-sm font-medium text-shodo-creme hover:bg-shodo-ink"
          @click="emit('close')"
        >Retour au site</button>
      </div>

      <div class="mb-4 flex gap-4 border-b border-shodo-marron/20">
        <button
          class="px-1 pb-2 text-sm font-medium"
          :class="tab === 'talkers' ? 'border-b-2 border-shodo-rose text-shodo-rose' : 'text-shodo-taupe'"
          @click="tab = 'talkers'"
        >Talkers ({{ talkers.length }})</button>
        <button
          class="px-1 pb-2 text-sm font-medium"
          :class="tab === 'talks' ? 'border-b-2 border-shodo-rose text-shodo-rose' : 'text-shodo-taupe'"
          @click="tab = 'talks'"
        >Talks ({{ activeTalks.length }})</button>
        <button
          class="px-1 pb-2 text-sm font-medium"
          :class="tab === 'pending' ? 'border-b-2 border-shodo-rose text-shodo-rose' : 'text-shodo-taupe'"
          @click="tab = 'pending'"
        >À valider ({{ pendingValidationTalks.length }})</button>
        <button
          class="px-1 pb-2 text-sm font-medium"
          :class="tab === 'undated' ? 'border-b-2 border-shodo-rose text-shodo-rose' : 'text-shodo-taupe'"
          @click="tab = 'undated'"
        >Non datés ({{ undatedTalks.length }})</button>
        <button
          class="px-1 pb-2 text-sm font-medium"
          :class="tab === 'trash' ? 'border-b-2 border-shodo-rose text-shodo-rose' : 'text-shodo-taupe'"
          @click="tab = 'trash'"
        >Corbeille ({{ deletedTalks.length }})</button>
        <button
          v-for="status in Object.keys(draftTalksByStatus)"
          :key="status"
          class="px-1 pb-2 text-sm font-medium"
          :class="tab === status ? 'border-b-2 border-shodo-rose text-shodo-rose' : 'text-shodo-taupe'"
          @click="tab = status"
        >{{ status }} ({{ draftTalksByStatus[status].length }})</button>
      </div>

      <AdminTalkersSection
        v-if="tab === 'talkers'"
        :talkers="talkers"
        :cities="cities"
        @update-city="onUpdateCity"
        @add-city="onAddCity"
        @delete-city="onDeleteCity"
        @update-active="onUpdateActive"
      />

      <AdminTalksSection v-else-if="tab === 'talks'" :talks="activeTalks" @delete="onDelete" @restore="onRestore" />

      <AdminPendingValidationSection
        v-else-if="tab === 'pending'"
        :talks="pendingValidationTalks"
        @validate="onValidate"
        @toggle-show-without-link="onToggleShowWithoutLink"
        @toggle-show-without-year="onToggleShowWithoutYear"
        @delete="onDelete"
      />

      <AdminUndatedSection
        v-else-if="tab === 'undated'"
        :talks="undatedTalks"
        @set-year="onSetYear"
        @toggle-show-without-year="onToggleShowWithoutYear"
      />

      <AdminTalksSection v-else-if="tab === 'trash'" :talks="deletedTalks" @delete="onDelete" @restore="onRestore" />

      <AdminDraftStatusSection
        v-else
        :talks="draftTalksByStatus[tab] ?? []"
        @validate="onValidateDraft"
        @delete="onDelete"
      />
    </div>
  </div>
</template>
