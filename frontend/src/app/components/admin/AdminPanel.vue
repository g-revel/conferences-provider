<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { adminClientKey } from '../../injectionKeys'
import AdminTalkersSection from './AdminTalkersSection.vue'
import AdminTalksSection from './AdminTalksSection.vue'
import AdminPendingValidationSection from './AdminPendingValidationSection.vue'
import type { Talker } from '../../../domain/admin/Talker'
import type { Talk } from '../../../domain/talks/Talk'

const props = defineProps<{ password: string }>()
const emit = defineEmits<{ close: [] }>()

const client = inject(adminClientKey)!
const talkers = ref<Talker[]>([])
const talks = ref<Talk[]>([])
const cities = ref<string[]>([])
const tab = ref<'talkers' | 'talks' | 'pending' | 'trash'>('talkers')

const activeTalks = computed(() => talks.value.filter((t) => !t.deletedAt))
const deletedTalks = computed(() => talks.value.filter((t) => t.deletedAt))
// Un talk sans titre n'a pas de valeur à valider (repère interne du pipeline, voir
// backend/CLAUDE.md) ; un talk supprimé n'a pas sa place dans la file de validation.
const pendingValidationTalks = computed(() =>
  activeTalks.value.filter((t) => t.title != null && t.videoUrl == null),
)

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
          :class="tab === 'trash' ? 'border-b-2 border-shodo-rose text-shodo-rose' : 'text-shodo-taupe'"
          @click="tab = 'trash'"
        >Corbeille ({{ deletedTalks.length }})</button>
      </div>

      <AdminTalkersSection
        v-if="tab === 'talkers'"
        :talkers="talkers"
        :cities="cities"
        @update-city="onUpdateCity"
        @add-city="onAddCity"
        @update-active="onUpdateActive"
      />

      <AdminTalksSection v-else-if="tab === 'talks'" :talks="activeTalks" @delete="onDelete" @restore="onRestore" />

      <AdminPendingValidationSection
        v-else-if="tab === 'pending'"
        :talks="pendingValidationTalks"
        @validate="onValidate"
        @toggle-show-without-link="onToggleShowWithoutLink"
        @delete="onDelete"
      />

      <AdminTalksSection v-else :talks="deletedTalks" @delete="onDelete" @restore="onRestore" />
    </div>
  </div>
</template>
