<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <section class="bg-white border-b" data-hygraph-entry-id="homepage-hero">
      <div class="max-w-6xl mx-auto px-6 py-16 text-center">
        <h1 class="text-5xl font-bold text-gray-900 mb-6" data-hygraph-field-api-id="heroTitle">
          Delicious Recipes
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto" data-hygraph-field-api-id="heroSubtitle">
          Discover amazing recipes from around the world. Each one carefully crafted and tested for the perfect dining experience.
        </p>
      </div>
    </section>

    <!-- Recipes Grid -->
    <main class="max-w-6xl mx-auto px-6 py-12">
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-4" data-hygraph-entry-id="recipe-section" data-hygraph-field-api-id="sectionTitle">
          Latest Recipes
        </h2>
        <p class="text-gray-600" data-hygraph-entry-id="recipe-section" data-hygraph-field-api-id="sectionDescription">
          Browse our collection of tried and tested recipes
        </p>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading recipes...</p>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-500">{{ error }}</p>
      </div>

      <div v-else-if="recipes.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <router-link
          v-for="recipe in recipes"
          :key="recipe.id"
          :to="`/recipes/${recipe.id}`"
          class="group block"
        >
          <article
            class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group-hover:shadow-xl"
            :data-hygraph-entry-id="recipe.id"
          >
            <div
              v-if="recipe.heroImage"
              class="aspect-video relative"
              data-hygraph-field-api-id="heroImage"
            >
              <img
                :src="recipe.heroImage.url"
                :alt="recipe.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div class="p-6">
              <div class="mb-4">
                <div
                  v-if="recipe.categories && recipe.categories.length > 0"
                  class="flex flex-wrap gap-2 mb-3"
                  data-hygraph-field-api-id="categories"
                >
                  <span
                    v-for="category in recipe.categories"
                    :key="category.id"
                    class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                  >
                    {{ category.name }}
                  </span>
                </div>

                <h3
                  class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors"
                  data-hygraph-field-api-id="title"
                >
                  {{ recipe.title }}
                </h3>

                <p
                  class="text-gray-600 text-sm leading-relaxed mb-4"
                  data-hygraph-field-api-id="description"
                >
                  {{ recipe.description.text }}
                </p>
              </div>

              <!-- Recipe Meta -->
              <div class="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                <div class="flex items-center space-x-4">
                  <span v-if="recipe.prepTime" data-hygraph-field-api-id="prepTime">
                    ⏱️ {{ recipe.prepTime }}min
                  </span>
                  <span v-if="recipe.difficulty" data-hygraph-field-api-id="difficulty">
                    📊 {{ recipe.difficulty }}
                  </span>
                  <span v-if="recipe.servings" data-hygraph-field-api-id="servings">
                    🍽️ {{ recipe.servings }}
                  </span>
                </div>

                <div
                  v-if="recipe.author"
                  class="flex items-center space-x-2"
                  data-hygraph-field-api-id="author"
                >
                  <img
                    v-if="recipe.author.profilePhoto"
                    :src="recipe.author.profilePhoto.url"
                    :alt="recipe.author.name"
                    class="w-6 h-6 rounded-full"
                  />
                  <span class="text-gray-700 font-medium">{{ recipe.author.name }}</span>
                </div>
              </div>
            </div>
          </article>
        </router-link>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-gray-500">No recipes found. Check your API connection.</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { graphqlRequest } from '@/lib/graphql'
import { GET_RECIPES_QUERY } from '@/lib/queries'
import type { Recipe } from '@/types'

const recipes = ref<Recipe[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const fetchRecipes = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await graphqlRequest<{ recipes: Recipe[] }>(GET_RECIPES_QUERY, { first: 12 })
    recipes.value = data.recipes || []
  } catch (err) {
    console.error('Failed to fetch recipes:', err)
    error.value = 'Failed to fetch recipes. Please check your API connection.'
    recipes.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRecipes()
})
</script>