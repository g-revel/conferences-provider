import { ref, inject, onMounted, type Ref, type ComputedRef, computed } from 'vue'
import { talksClientKey } from '../../injectionKeys'
import type { Talk } from '../../../domain/talks/Talk'

export function useListTalks(): ComputedRef<Talk[]> {
  const client = inject(talksClientKey)!
  const list: Ref<Talk[]> = ref([])

  onMounted(async () => {
    list.value = await client.getTalks()
  })

  return computed(() => list.value)
}
