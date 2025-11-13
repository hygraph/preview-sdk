# Vue 3 Guide

Complete guide for integrating Hygraph Preview SDK with Vue 3 and Vue Router.

## Installation

```bash
npm install @hygraph/preview-sdk
```

## Setup

### 1. Create Preview Wrapper Component

```vue
<!-- src/components/PreviewWrapper.vue -->
<template>
  <div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
let preview: any = null

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
          router.go(0) // Full page refresh
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
```

### 2. Add to App.vue

```vue
<!-- src/App.vue -->
<template>
  <PreviewWrapper>
    <router-view />
  </PreviewWrapper>
</template>

<script setup lang="ts">
import PreviewWrapper from './components/PreviewWrapper.vue'
</script>
```

### 3. Environment Variables

```bash
# .env.local
VITE_HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/your-project-id/master
VITE_HYGRAPH_STUDIO_URL=https://app.hygraph.com
```

### 4. Configure Preview URL in Hygraph Studio

1. Log into [Hygraph Studio](https://app.hygraph.com)
2. Navigate to **Project Settings → Preview URLs**
3. Add a preview entry that targets your Vue dev server (e.g. `http://localhost:4502/recipes/{entryId}`)
4. Save the configuration and launch **Open Preview** on an entry to load the SDK inside Studio

### 5. Mark Content

```vue
<template>
  <article :data-hygraph-entry-id="post.id">
    <h1
      :data-hygraph-entry-id="post.id"
      data-hygraph-field-api-id="title"
    >
      {{ post.title }}
    </h1>

    <div
      :data-hygraph-entry-id="post.id"
      data-hygraph-field-api-id="content"
      v-html="post.content.html"
    />
  </article>
</template>
```

## Why Core API?

Vue 3 doesn't have official React support, so we use the core SDK directly. The core API gives you full control and works great with Vue's Composition API.

## Alternative: Smoother Refresh

Instead of `router.go(0)` (full page reload), you can re-fetch data:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const post = ref(null)

async function fetchPost() {
  const response = await fetch(`/api/posts/${route.params.slug}`)
  post.value = await response.json()
}

onMounted(async () => {
  await fetchPost()

  // Setup preview
  const { Preview } = await import('@hygraph/preview-sdk/core')
  const preview = new Preview({
    endpoint: import.meta.env.VITE_HYGRAPH_ENDPOINT,
    debug: true,
  })

  preview.subscribe('save', {
    callback: async () => {
      await fetchPost() // Re-fetch data instead of full reload
    }
  })
})
</script>
```

## Using with Pinia

If you use Pinia for state management:

```typescript
// stores/preview.ts
import { defineStore } from 'pinia'
import { Preview } from '@hygraph/preview-sdk/core'

export const usePreviewStore = defineStore('preview', () => {
  let preview: Preview | null = null

  function init() {
    if (import.meta.env.DEV) {
      preview = new Preview({
        endpoint: import.meta.env.VITE_HYGRAPH_ENDPOINT,
        debug: true,
      })
    }
  }

  function destroy() {
    preview?.destroy()
    preview = null
  }

  return { init, destroy }
})
```

## Composable Pattern

Create a reusable composable:

```typescript
// composables/usePreview.ts
import { onMounted, onUnmounted } from 'vue'
import { Preview } from '@hygraph/preview-sdk/core'

export function usePreview(onSave?: () => void) {
  let preview: Preview | null = null

  onMounted(async () => {
    if (import.meta.env.DEV && import.meta.env.VITE_HYGRAPH_ENDPOINT) {
      preview = new Preview({
        endpoint: import.meta.env.VITE_HYGRAPH_ENDPOINT,
        debug: true,
      })

      if (onSave) {
        preview.subscribe('save', { callback: onSave })
      }
    }
  })

  onUnmounted(() => {
    preview?.destroy()
  })

  return { preview }
}
```

Use in components:

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePreview } from '@/composables/usePreview'

const router = useRouter()

usePreview(() => {
  router.go(0)
})
</script>
```

## Complete Example

See the [complete Vue example](../../examples/vue-example/) for a working implementation.
