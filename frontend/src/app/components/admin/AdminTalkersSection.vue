<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Talker } from '../../../domain/admin/Talker'

const ADD_CITY_OPTION = '__add_city__'

const props = defineProps<{ talkers: Talker[]; cities: string[] }>()
const emit = defineEmits<{ updateCity: [talker: Talker, city: string]; addCity: [city: string] }>()

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

// Garde visible une valeur déjà enregistrée qui ne serait pas (ou plus) dans la
// liste statique des villes connues, plutôt que de la faire disparaître du select.
function optionsFor(talker: Talker): string[] {
  const draft = drafts.value[talkerKey(talker)]
  return draft && !props.cities.includes(draft) ? [...props.cities, draft].sort() : props.cities
}

// `:value` (pas v-model) : si l'admin annule le prompt, le select doit revenir à
// la valeur réelle du brouillon plutôt que de rester bloqué sur l'option "Ajouter".
function onCityChange(talker: Talker, event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (value !== ADD_CITY_OPTION) {
    drafts.value[talkerKey(talker)] = value
    return
  }
  const name = prompt('Nom de la nouvelle ville :')?.trim()
  if (name) {
    emit('addCity', name)
    drafts.value[talkerKey(talker)] = name
  } else {
    // Annulé : le brouillon n'a pas changé, mais le <select> natif a déjà pris la
    // valeur sentinelle au moment du `change` — le remettre explicitement plutôt
    // que de compter sur un re-rendu Vue qui ne se produira pas (rien n'a changé
    // du point de vue de la réactivité).
    ;(event.target as HTMLSelectElement).value = drafts.value[talkerKey(talker)] ?? ''
  }
}
</script>

<template>
  <table class="w-full text-sm">
    <thead>
      <tr class="text-left text-shodo-taupe">
        <th class="py-2 pr-4">Nom</th>
        <th class="py-2 pr-4">Société (Slack)</th>
        <th class="py-2 pr-4">Ville</th>
        <th class="py-2"></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="talker in talkers" :key="talkerKey(talker)" class="border-t border-shodo-marron/15">
        <td class="py-2 pr-4 font-medium text-shodo-noir">{{ talker.firstname }} {{ talker.lastname }}</td>
        <td class="py-2 pr-4 text-shodo-taupe">{{ talker.company }}</td>
        <td class="py-2 pr-4">
          <select
            :value="drafts[talkerKey(talker)]"
            class="w-36 rounded border border-shodo-marron/30 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-shodo-rose"
            @change="onCityChange(talker, $event)"
          >
            <option value="">(aucune)</option>
            <option v-for="city in optionsFor(talker)" :key="city" :value="city">{{ city }}</option>
            <option :value="ADD_CITY_OPTION">Ajouter une ville...</option>
          </select>
        </td>
        <td class="py-2">
          <button
            class="rounded bg-shodo-rose px-2 py-1 text-xs font-medium text-white hover:opacity-90"
            @click="save(talker)"
          >Enregistrer</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
