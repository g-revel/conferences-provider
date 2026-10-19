<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ error?: boolean }>()
const emit = defineEmits<{ submit: [password: string]; close: [] }>()

const password = ref('')

function submit(): void {
  emit('submit', password.value)
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="emit('close')">
    <form class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" @submit.prevent="submit">
      <h2 class="mb-3 font-display text-lg font-extrabold text-shodo-noir">Accès admin</h2>
      <input
        v-model="password"
        type="password"
        placeholder="Mot de passe"
        autofocus
        class="w-full rounded-lg border border-shodo-marron/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shodo-rose"
      />
      <p v-if="error" class="mt-2 text-sm text-red-600">Mot de passe incorrect.</p>
      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm text-shodo-taupe hover:bg-shodo-creme"
          @click="emit('close')"
        >Annuler</button>
        <button
          type="submit"
          class="rounded-lg bg-shodo-rose px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >Valider</button>
      </div>
    </form>
  </div>
</template>
