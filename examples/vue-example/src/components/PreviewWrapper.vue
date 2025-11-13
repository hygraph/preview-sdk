<template>
  <div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
let preview: { destroy: () => void; subscribe: (event: string, options: { callback: () => void }) => void } | null = null

onMounted(async () => {
  // Only load in development
  if (import.meta.env.DEV && import.meta.env.VITE_HYGRAPH_ENDPOINT) {
    try {
      const { Preview } = await import('@hygraph/preview-sdk/core')

      preview = new Preview({
        endpoint: import.meta.env.VITE_HYGRAPH_ENDPOINT,
        studioUrl: import.meta.env.VITE_HYGRAPH_STUDIO_URL,
        debug: true,
      })

      // Refresh page on save
      preview.subscribe('save', {
        callback: () => {
          console.log('Content saved, refreshing...')
          router.go(0)
        }
      })
    } catch (error) {
      console.warn('Could not load Hygraph Preview:', error)
    }
  }
})

onUnmounted(() => {
  if (preview) {
    preview.destroy()
    preview = null
  }
})
</script>
