<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Talker } from '../../../domain/admin/Talker'

const props = defineProps<{ talkers: Talker[] }>()
const emit = defineEmits<{ updateCity: [talker: Talker, city: string] }>()

function talkerKey(talker: Talker): string {
  return `${talker.firstname}|${talker.lastname}`
}

// Brouillon local par ligne : permet d'éditer sans renvoyer une requête à chaque
// frappe, initialisé une seule fois par talker (pas réécrasé si le parent recharge
// la liste suite à l'enregistrement d'un autre talker).
const drafts = ref<Record<string, string>>({})

watch(
  () => props.talkers,
  (talkers) => {
    for (const talker of talkers) {
      const key = talkerKey(talker)
      if (!(key in drafts.value)) drafts.value[key] = talker.city ?? ''
    }
  },
  { immediate: true },
)

function save(talker: Talker): void {
  emit('updateCity', talker, drafts.value[talkerKey(talker)] ?? '')
}
</script>

<template>
  <table class="w-full text-sm">
    <thead>
      <tr class="text-left text-gray-500">
        <th class="py-2 pr-4">Nom</th>
        <th class="py-2 pr-4">Société (Slack)</th>
        <th class="py-2 pr-4">Ville</th>
        <th class="py-2"></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="talker in talkers" :key="talkerKey(talker)" class="border-t border-gray-100">
        <td class="py-2 pr-4 font-medium text-gray-900">{{ talker.firstname }} {{ talker.lastname }}</td>
        <td class="py-2 pr-4 text-gray-500">{{ talker.company }}</td>
        <td class="py-2 pr-4">
          <input
            v-model="drafts[talkerKey(talker)]"
            type="text"
            placeholder="(aucune)"
            class="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </td>
        <td class="py-2">
          <button
            class="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
            @click="save(talker)"
          >Enregistrer</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
