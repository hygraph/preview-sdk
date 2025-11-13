<template>
  <div class="min-h-screen bg-gray-50">
    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500">Loading recipe...</p>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-500">{{ error }}</p>
      <router-link to="/" class="text-blue-600 hover:underline mt-4 inline-block">
        ← Back to all recipes
      </router-link>
    </div>

    <div v-else-if="recipe" class="max-w-4xl mx-auto px-6 py-8" :data-hygraph-entry-id="recipe.id">
      <!-- Back Navigation -->
      <div class="mb-6">
        <router-link to="/" class="text-blue-600 hover:underline">
          ← Back to all recipes
        </router-link>
      </div>

      <!-- Hero Section -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div
          v-if="recipe.heroImage"
          class="aspect-video relative"
          data-hygraph-field-api-id="heroImage"
          :data-hygraph-entry-id="recipe.id"
        >
          <img
            :src="recipe.heroImage.url"
            :alt="recipe.title"
            class="w-full h-full object-cover"
          />
        </div>

        <div class="p-8">
          <div class="mb-6">
            <div
              v-if="recipe.categories && recipe.categories.length > 0"
              class="flex flex-wrap gap-2 mb-4"
              data-hygraph-field-api-id="categories"
              :data-hygraph-entry-id="recipe.id"
            >
              <span
                v-for="category in recipe.categories"
                :key="category.id"
                class="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
              >
                {{ category.name }}
              </span>
            </div>

            <h1
              class="text-4xl font-bold text-gray-900 mb-4"
              data-hygraph-field-api-id="title"
              :data-hygraph-entry-id="recipe.id"
            >
              {{ recipe.title }}
            </h1>

            <div
              class="text-gray-600 text-lg leading-relaxed mb-6"
              data-hygraph-field-api-id="description"
              v-html="recipe.description.html"
              :data-hygraph-entry-id="recipe.id"
            ></div>
          </div>

          <!-- Recipe Meta -->
          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
            <div
              v-if="recipe.prepTime"
              data-hygraph-field-api-id="prepTime"
              :data-hygraph-entry-id="recipe.id"
            >
              <span class="text-gray-500 text-sm block">Prep Time</span>
              <span class="font-semibold">{{ recipe.prepTime }} min</span>
            </div>
            <div
              v-if="recipe.cookTime"
              data-hygraph-field-api-id="cookTime"
              :data-hygraph-entry-id="recipe.id"
            >
              <span class="text-gray-500 text-sm block">Cook Time</span>
              <span class="font-semibold">{{ recipe.cookTime }} min</span>
            </div>
            <div
              v-if="recipe.servings"
              data-hygraph-field-api-id="servings"
              :data-hygraph-entry-id="recipe.id"
            >
              <span class="text-gray-500 text-sm block">Servings</span>
              <span class="font-semibold">{{ recipe.servings }}</span>
            </div>
            <div
              v-if="recipe.difficulty"
              data-hygraph-field-api-id="difficulty"
              :data-hygraph-entry-id="recipe.id"
            >
              <span class="text-gray-500 text-sm block">Difficulty</span>
              <span class="font-semibold">{{ recipe.difficulty }}</span>
            </div>
          </div>

          <!-- Author -->
          <div
            v-if="recipe.author"
            class="flex items-center p-4 bg-gray-50 rounded-lg mb-8"
            data-hygraph-field-api-id="author"
            :data-hygraph-entry-id="recipe.id"
          >
            <img
              v-if="recipe.author.profilePhoto"
              :src="recipe.author.profilePhoto.url"
              :alt="recipe.author.name"
              class="w-16 h-16 rounded-full mr-4"
            />
            <div>
              <h3 class="font-semibold text-lg">{{ recipe.author.name }}</h3>
              <p v-if="recipe.author.specialty" class="text-gray-600">{{ recipe.author.specialty }}</p>
              <p class="text-gray-600 text-sm">{{ recipe.author.bio.text }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Ingredients -->
      <div
        v-if="recipe.ingredients && recipe.ingredients.length > 0"
        class="bg-white rounded-lg shadow-lg p-8 mb-8"
        data-hygraph-field-api-id="ingredients"
        :data-hygraph-entry-id="recipe.id"
      >
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Ingredients</h2>
        <ul class="space-y-3">
          <li
            v-for="(ingredient, index) in recipe.ingredients"
            :key="index"
            class="flex items-center"
          >
            <span class="w-4 h-4 bg-blue-100 rounded-full mr-3"></span>
            <span>
              {{ ingredient.quantity }} {{ ingredient.unit }} {{ ingredient.ingredient.name }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Instructions -->
      <div
        v-if="recipe.recipeSteps && recipe.recipeSteps.length > 0"
        class="bg-white rounded-lg shadow-lg p-8 mb-8"
        data-hygraph-field-api-id="recipeSteps"
        :data-hygraph-entry-id="recipe.id"
      >
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Instructions</h2>
        <div class="space-y-6">
          <div
            v-for="step in recipe.recipeSteps"
            :key="step.stepNumber"
            class="flex"
          >
            <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-4 mt-1">
              {{ step.stepNumber }}
            </div>
            <div class="flex-grow">
              <h3 v-if="step.title" class="font-semibold text-lg mb-2">{{ step.title }}</h3>
              <div class="text-gray-600 leading-relaxed" v-html="step.instruction.html"></div>
              <p v-if="step.estimatedTime" class="text-sm text-gray-500 mt-2">
                Estimated time: {{ step.estimatedTime }} minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Nutrition Info -->
      <div
        v-if="recipe.nutrition"
        class="bg-white rounded-lg shadow-lg p-8 mb-8"
        data-hygraph-field-api-id="nutrition"
        :data-hygraph-entry-id="recipe.id"
      >
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Nutrition Information</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="text-center" data-hygraph-field-api-id="nutrition.calories" :data-hygraph-entry-id="recipe.id">
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ recipe.nutrition.calories }}</div>
            <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Calories</div>
          </div>
          <div class="text-center" data-hygraph-field-api-id="nutrition.protein" :data-hygraph-entry-id="recipe.id">
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ recipe.nutrition.protein }}g</div>
            <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Protein</div>
          </div>
          <div class="text-center" data-hygraph-field-api-id="nutrition.carbohydrates" :data-hygraph-entry-id="recipe.id">
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ recipe.nutrition.carbohydrates }}g</div>
            <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Carbs</div>
          </div>
          <div class="text-center" data-hygraph-field-api-id="nutrition.fat" :data-hygraph-entry-id="recipe.id">
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ recipe.nutrition.fat }}g</div>
            <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Fat</div>
          </div>
          <div class="text-center" data-hygraph-field-api-id="nutrition.fiber" :data-hygraph-entry-id="recipe.id">
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ recipe.nutrition.fiber }}g</div>
            <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Fiber</div>
          </div>
          <div class="text-center" data-hygraph-field-api-id="nutrition.sugar" :data-hygraph-entry-id="recipe.id">
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ recipe.nutrition.sugar }}g</div>
            <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Sugar</div>
          </div>
          <div class="text-center" data-hygraph-field-api-id="nutrition.sodium" :data-hygraph-entry-id="recipe.id">
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ recipe.nutrition.sodium }}mg</div>
            <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Sodium</div>
          </div>
        </div>
      </div>

      <!-- Gallery -->
      <div
        v-if="recipe.gallery && recipe.gallery.length > 0"
        class="bg-white rounded-lg shadow-lg p-8 mb-8"
        data-hygraph-field-api-id="gallery"
        :data-hygraph-entry-id="recipe.id"
      >
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Gallery</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="image in recipe.gallery"
            :key="image.id"
            class="aspect-square relative rounded-lg overflow-hidden"
          >
            <img
              :src="image.url"
              :alt="image.fileName"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>

      <!-- Reviews -->
      <div
        v-if="recipe.reviews && recipe.reviews.length > 0"
        class="bg-white rounded-lg shadow-lg p-8"
        data-hygraph-field-api-id="reviews"
        :data-hygraph-entry-id="recipe.id"
      >
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
        <div class="space-y-6">
          <div
            v-for="review in recipe.reviews"
            :key="review.id"
            class="border-b pb-4 last:border-b-0"
          >
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold">{{ review.reviewerName }}</h4>
              <div class="flex items-center">
                <span v-for="i in 5" :key="i" class="text-yellow-400">
                  {{ i <= review.rating ? '★' : '☆' }}
                </span>
              </div>
            </div>
            <p class="text-gray-600">{{ review.comment.text }}</p>
            <p class="text-sm text-gray-500 mt-2">
              {{ new Date(review.createdAt).toLocaleDateString() }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { graphqlRequest } from '@/lib/graphql'
import { GET_RECIPE_BY_ID_QUERY } from '@/lib/queries'
import type { Recipe } from '@/types'

const route = useRoute()
const recipe = ref<Recipe | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const fetchRecipe = async (id: string) => {
  try {
    loading.value = true
    error.value = null
    const data = await graphqlRequest<{ recipe: Recipe }>(GET_RECIPE_BY_ID_QUERY, { id })
    recipe.value = data.recipe
  } catch (err) {
    console.error('Failed to fetch recipe:', err)
    error.value = 'Failed to fetch recipe. Please check your API connection.'
    recipe.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  if (id) {
    fetchRecipe(id)
  }
})

watch(
  () => route.params.id,
  (newId) => {
    const id = Array.isArray(newId) ? newId[0] : newId
    if (id) {
      fetchRecipe(id)
    }
  }
)
</script>