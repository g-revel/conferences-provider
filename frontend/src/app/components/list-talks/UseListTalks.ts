import { ref, inject, onMounted, type Ref, type ComputedRef, computed } from 'vue'
import { talksClientKey } from '../../injectionKeys'
import type { Talk } from '../../../domain/talks/Talk'

export interface UseListTalksResult {
  talks: ComputedRef<Talk[]>
  isLoading: Ref<boolean>
  error: Ref<boolean>
}

// isLoading reste à true tant que le premier fetch n'est pas résolu — utile pour
// afficher un indicateur pendant un cold start du backend (plan gratuit Render,
// jusqu'à 30-50s sur la première requête après une période d'inactivité).
export function useListTalks(): UseListTalksResult {
  const client = inject(talksClientKey)!
  const list: Ref<Talk[]> = ref([])
  const isLoading = ref(true)
  const error = ref(false)

  onMounted(async () => {
    try {
      list.value = await client.getTalks()
    } catch {
      error.value = true
    } finally {
      isLoading.value = false
    }
  })

  return { talks: computed(() => list.value), isLoading, error }
}
