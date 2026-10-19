<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { adminClientKey } from '../../injectionKeys'
import AdminTalkersSection from './AdminTalkersSection.vue'
import AdminTalksSection from './AdminTalksSection.vue'
import type { Talker } from '../../../domain/admin/Talker'
import type { Talk } from '../../../domain/talks/Talk'

const props = defineProps<{ password: string }>()
const emit = defineEmits<{ close: [] }>()

const client = inject(adminClientKey)!
const talkers = ref<Talker[]>([])
const talks = ref<Talk[]>([])
const tab = ref<'talkers' | 'talks'>('talkers')

const activeTalks = computed(() => talks.value.filter((t) => !t.deletedAt))
const deletedTalks = computed(() => talks.value.filter((t) => t.deletedAt))

async function reload(): Promise<void> {
  talkers.value = await client.getTalkers(props.password)
  talks.value = await client.getAllTalks(props.password)
}

onMounted(reload)

async function onUpdateCity(talker: Talker, city: string): Promise<void> {
  await client.setTalkerCity(props.password, talker.firstname, talker.lastname, city.trim() || null)
  await reload()
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
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="w-full px-4 py-10 md:px-8">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-900">Admin</h1>
        <button
          class="rounded-lg bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
          @click="emit('close')"
        >Retour au site</button>
      </div>

      <div class="mb-4 flex gap-4 border-b border-gray-200">
        <button
          class="px-1 pb-2 text-sm font-medium"
          :class="tab === 'talkers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'"
          @click="tab = 'talkers'"
        >Talkers ({{ talkers.length }})</button>
        <button
          class="px-1 pb-2 text-sm font-medium"
          :class="tab === 'talks' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'"
          @click="tab = 'talks'"
        >Talks ({{ activeTalks.length }}) · Corbeille ({{ deletedTalks.length }})</button>
      </div>

      <AdminTalkersSection v-if="tab === 'talkers'" :talkers="talkers" @update-city="onUpdateCity" />

      <div v-else>
        <h2 class="mb-2 text-sm font-semibold text-gray-700">Talks actifs</h2>
        <AdminTalksSection :talks="activeTalks" @delete="onDelete" @restore="onRestore" />

        <h2 class="mt-8 mb-2 text-sm font-semibold text-gray-700">Corbeille</h2>
        <AdminTalksSection :talks="deletedTalks" @delete="onDelete" @restore="onRestore" />
      </div>
    </div>
  </div>
</template>
