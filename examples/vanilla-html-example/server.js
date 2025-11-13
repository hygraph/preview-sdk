import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4503;

// Configuration
const CONFIG = {
  HYGRAPH_ENDPOINT:
    process.env.HYGRAPH_ENDPOINT ||
    'https://eu-central-1.cdn.hygraph.com/content/YOUR_PROJECT_ID/master',
  HYGRAPH_TOKEN: process.env.HYGRAPH_TOKEN || '',
  PREVIEW_DEBUG: true,
  HYGRAPH_STUDIO_URL: process.env.HYGRAPH_STUDIO_URL || undefined
};

// GraphQL queries
const GET_RECIPES_QUERY = `
  query GetRecipes($first: Int) {
    recipes(stage: DRAFT, first: $first, orderBy: createdAt_DESC) {
      id
      title
      description {
        text
        html
      }
      slug
      difficulty
      prepTime
      cookTime
      servings
      heroImage {
        id
        url
        fileName
        width
        height
      }
      author {
        id
        name
        bio {
          text
        }
        specialty
        profilePhoto {
          id
          url
          width
          height
        }
      }
      categories {
        id
        name
        slug
      }
    }
  }
`;

const GET_RECIPE_BY_ID_QUERY = `
  query GetRecipeById($id: ID!) {
    recipe(where: { id: $id }, stage: DRAFT) {
      id
      title
      description {
        text
        html
      }
      slug
      difficulty
      prepTime
      cookTime
      servings
      heroImage {
        id
        url
        fileName
        width
        height
      }
      author {
        id
        name
        bio {
          text
        }
        specialty
        profilePhoto {
          id
          url
          width
          height
        }
      }
      categories {
        id
        name
        slug
      }
      ingredients {
        id
        quantity
        unit
        ingredient {
          name
        }
      }
      recipeSteps {
        id
        stepNumber
        title
        instruction {
          text
          html
        }
        estimatedTime
      }
      reviews {
        id
        rating
        comment {
          text
        }
        reviewerName
        createdAt
      }
      nutrition {
        id
        calories
        protein
        carbohydrates
        fat
        fiber
        sugar
        sodium
      }
      gallery {
        id
        url
        fileName
        width
        height
      }
    }
  }
`;

// GraphQL request function
async function graphqlRequest(query, variables = {}) {
  try {
    const response = await fetch(CONFIG.HYGRAPH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CONFIG.HYGRAPH_TOKEN && { Authorization: `Bearer ${CONFIG.HYGRAPH_TOKEN}` }),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL Error');
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    throw error;
  }
}

// Serve static files (CSS, JS, images) - but not the root directory
app.use('/js', express.static(join(__dirname, 'js')));
app.use('/css', express.static(join(__dirname, 'css')));
app.use('/images', express.static(join(__dirname, 'images')));

// Favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Home page route
app.get('/', async (req, res) => {
  try {
    const data = await graphqlRequest(GET_RECIPES_QUERY, { first: 12 });
    const recipes = data.recipes || [];

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delicious Recipes - Hygraph Recipe Example</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .recipe-card:hover .recipe-image {
      transform: scale(1.05);
    }
    .recipe-image {
      transition: transform 0.3s ease;
    }
  </style>
</head>
<body class="min-h-screen bg-gray-50">
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

    ${recipes.length > 0 ? `
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${recipes.map(recipe => {
          const categories = recipe.categories && recipe.categories.length > 0
            ? recipe.categories.map(category =>
                `<span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  ${category.name}
                </span>`
              ).join('')
            : '';

          const heroImage = recipe.heroImage
            ? `<div class="aspect-video relative" data-hygraph-field-api-id="heroImage">
                 <img
                   src="${recipe.heroImage.url}"
                   alt="${recipe.title}"
                   class="w-full h-full object-cover recipe-image"
                   loading="lazy"
                 />
               </div>`
            : '';

          const prepTime = recipe.prepTime ? `<span data-hygraph-field-api-id="prepTime">⏱️ ${recipe.prepTime}min</span>` : '';
          const difficulty = recipe.difficulty ? `<span data-hygraph-field-api-id="difficulty">📊 ${recipe.difficulty}</span>` : '';
          const servings = recipe.servings ? `<span data-hygraph-field-api-id="servings">🍽️ ${recipe.servings}</span>` : '';

          const metaItems = [prepTime, difficulty, servings].filter(item => item).join('');

          const authorSection = recipe.author
            ? `<div class="flex items-center space-x-2" data-hygraph-field-api-id="author">
                 ${recipe.author.profilePhoto
                   ? `<img
                        src="${recipe.author.profilePhoto.url}"
                        alt="${recipe.author.name}"
                        class="w-6 h-6 rounded-full"
                        loading="lazy"
                      />`
                   : ''
                 }
                 <span class="text-gray-700 font-medium">${recipe.author.name}</span>
               </div>`
            : '';

          return `
            <a href="/recipes/${recipe.id}" class="group block">
              <article
                class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group-hover:shadow-xl recipe-card"
                data-hygraph-entry-id="${recipe.id}"
              >
                ${heroImage}

                <div class="p-6">
                  <div class="mb-4">
                    ${categories ? `<div class="flex flex-wrap gap-2 mb-3" data-hygraph-field-api-id="categories">${categories}</div>` : ''}

                    <h3 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors" data-hygraph-field-api-id="title">
                      ${recipe.title}
                    </h3>

                    <p class="text-gray-600 text-sm leading-relaxed mb-4" data-hygraph-field-api-id="description">
                      ${recipe.description.text}
                    </p>
                  </div>

                  ${metaItems || authorSection ? `
                    <div class="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                      <div class="flex items-center space-x-4">
                        ${metaItems}
                      </div>
                      ${authorSection}
                    </div>
                  ` : ''}
                </div>
              </article>
            </a>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="text-center py-12">
        <p class="text-gray-500">No recipes found. Check your API connection.</p>
      </div>
    `}
  </main>

  <script src="/js/preview-sdk.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.HygraphPreviewSDK && window.HygraphPreviewSDK.Preview) {
        const preview = new window.HygraphPreviewSDK.Preview({
          endpoint: '${CONFIG.HYGRAPH_ENDPOINT}',
          debug: ${CONFIG.PREVIEW_DEBUG},
          studioUrl: '${CONFIG.HYGRAPH_STUDIO_URL}',
          overlayEnabled: true
        });

        console.log('Live Preview initialized', preview.getVersion());
      } else {
        console.error('Live Preview not loaded');
      }
    });
  </script>
</body>
</html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Failed to load recipes:', error);
    res.status(500).send('Error loading recipes');
  }
});

// Recipe detail route
app.get('/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await graphqlRequest(GET_RECIPE_BY_ID_QUERY, { id });
    const recipe = data.recipe;

    if (!recipe) {
      return res.status(404).send('Recipe not found');
    }

    // Generate hero image section
    const heroImage = recipe.heroImage
      ? `<div data-hygraph-field-api-id="heroImage">
           <div class="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-xl">
             <img
               src="${recipe.heroImage.url}"
               alt="${recipe.title}"
               class="w-full h-full object-cover"
               loading="lazy"
             />
           </div>
         </div>`
      : '';

    // Generate recipe meta information
    const metaItems = [
      recipe.prepTime ? `<div class="text-center" data-hygraph-field-api-id="prepTime" data-hygraph-entry-id="${recipe.id}">
        <div class="text-3xl mb-2 opacity-60">⏱️</div>
        <div class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Prep Time</div>
        <div class="text-xl font-light text-gray-900">${recipe.prepTime}min</div>
      </div>` : '',
      recipe.cookTime ? `<div class="text-center" data-hygraph-field-api-id="cookTime" data-hygraph-entry-id="${recipe.id}">
        <div class="text-3xl mb-2 opacity-60">🔥</div>
        <div class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Cook Time</div>
        <div class="text-xl font-light text-gray-900">${recipe.cookTime}min</div>
      </div>` : '',
      recipe.servings ? `<div class="text-center" data-hygraph-field-api-id="servings" data-hygraph-entry-id="${recipe.id}">
        <div class="text-3xl mb-2 opacity-60">🍽️</div>
        <div class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Servings</div>
        <div class="text-xl font-light text-gray-900">${recipe.servings}</div>
      </div>` : '',
      recipe.difficulty ? `<div class="text-center" data-hygraph-field-api-id="difficulty" data-hygraph-entry-id="${recipe.id}">
        <div class="text-3xl mb-2 opacity-60">📊</div>
        <div class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Difficulty</div>
        <div class="text-xl font-light text-gray-900">${recipe.difficulty}</div>
      </div>` : ''
    ].filter(item => item).join('');

    // Generate categories section
    const categories = recipe.categories && recipe.categories.length > 0
      ? `<div class="mb-8" data-hygraph-field-api-id="categories">
           <div class="flex flex-wrap gap-3">
             ${recipe.categories.map(category =>
               `<span class="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200">
                  ${category.name}
                </span>`
             ).join('')}
           </div>
         </div>`
      : '';

    // Generate ingredients section
    const ingredients = recipe.ingredients && recipe.ingredients.length > 0
      ? `<div class="space-y-4" data-hygraph-entry-id="${recipe.id}" data-hygraph-field-api-id="ingredients">
           ${recipe.ingredients.map((ingredient) => {
             const componentChain = JSON.stringify([{fieldApiId: 'ingredients', instanceId: ingredient.id}]);
             return `<div class="group hover:bg-gray-50 rounded-xl p-4 transition-colors duration-200">
                <div class="flex justify-between items-start">
                  <span class="font-medium text-gray-900 text-lg">${ingredient.ingredient.name}</span>
                  <div class="text-sm font-medium text-gray-500 ml-4">
                    <span 
                      data-hygraph-entry-id="${recipe.id}" 
                      data-hygraph-field-api-id="quantity" 
                      data-hygraph-component-chain='${componentChain}'
                    >${ingredient.quantity}</span>
                    <span 
                      data-hygraph-entry-id="${recipe.id}" 
                      data-hygraph-field-api-id="unit" 
                      data-hygraph-component-chain='${componentChain}'
                    >${ingredient.unit.toLowerCase()}</span>
                  </div>
                </div>
              </div>`;
           }).join('')}
         </div>`
      : `<p class="text-gray-500 italic">No ingredients listed.</p>`;

    // Generate recipe steps section
    const recipeSteps = recipe.recipeSteps && recipe.recipeSteps.length > 0
      ? `<div class="space-y-8" data-hygraph-entry-id="${recipe.id}" data-hygraph-field-api-id="recipeSteps">
           ${recipe.recipeSteps.map((step) => {
             const componentChain = JSON.stringify([{fieldApiId: 'recipeSteps', instanceId: step.id}]);
             return `<div class="group">
                <div class="flex items-start space-x-6">
                  <div 
                    class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 rounded-full flex items-center justify-center font-medium text-lg shadow-sm"
                    data-hygraph-entry-id="${recipe.id}" 
                    data-hygraph-field-api-id="stepNumber" 
                    data-hygraph-component-chain='${componentChain}'
                  >
                    ${step.stepNumber}
                  </div>
                  <div class="flex-1 pt-1">
                    ${step.title ? `<h3 
                      class="text-xl font-medium text-gray-900 mb-3"
                      data-hygraph-entry-id="${recipe.id}" 
                      data-hygraph-field-api-id="title" 
                      data-hygraph-component-chain='${componentChain}'
                    >${step.title}</h3>` : ''}
                    <div 
                      class="prose prose-lg prose-gray max-w-none text-gray-600 leading-relaxed"
                      data-hygraph-entry-id="${recipe.id}" 
                      data-hygraph-field-api-id="instruction" 
                      data-hygraph-component-chain='${componentChain}'
                      data-hygraph-rich-text-format="html"
                    >
                      ${step.instruction.html}
                    </div>
                    ${step.estimatedTime ? `
                      <div 
                        class="inline-flex items-center mt-4 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600"
                        data-hygraph-entry-id="${recipe.id}" 
                        data-hygraph-field-api-id="estimatedTime" 
                        data-hygraph-component-chain='${componentChain}'
                      >
                        <span class="mr-2 opacity-60">⏱️</span>
                        ${step.estimatedTime} minutes
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>`;
           }).join('')}
         </div>`
      : `<p class="text-gray-500 italic">No instructions available.</p>`;

    // Generate nutrition section
    const nutrition = recipe.nutrition
      ? `<section class="mt-16 bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8" data-hygraph-field-api-id="nutrition" data-hygraph-entry-id="${recipe.id}">
           <h2 class="text-3xl font-light text-gray-900 mb-8">Nutrition Information</h2>
           <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
             <div class="text-center" data-hygraph-field-api-id="nutrition.calories" data-hygraph-entry-id="${recipe.id}">
               <div class="text-3xl font-light text-gray-900 mb-1">${recipe.nutrition.calories}</div>
               <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Calories</div>
             </div>
             <div class="text-center" data-hygraph-field-api-id="nutrition.protein" data-hygraph-entry-id="${recipe.id}">
               <div class="text-3xl font-light text-gray-900 mb-1">${recipe.nutrition.protein}g</div>
               <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Protein</div>
             </div>
             <div class="text-center" data-hygraph-field-api-id="nutrition.carbohydrates" data-hygraph-entry-id="${recipe.id}">
               <div class="text-3xl font-light text-gray-900 mb-1">${recipe.nutrition.carbohydrates}g</div>
               <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Carbs</div>
             </div>
             <div class="text-center" data-hygraph-field-api-id="nutrition.fat" data-hygraph-entry-id="${recipe.id}">
               <div class="text-3xl font-light text-gray-900 mb-1">${recipe.nutrition.fat}g</div>
               <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Fat</div>
             </div>
             <div class="text-center" data-hygraph-field-api-id="nutrition.fiber" data-hygraph-entry-id="${recipe.id}">
               <div class="text-3xl font-light text-gray-900 mb-1">${recipe.nutrition.fiber}g</div>
               <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Fiber</div>
             </div>
             <div class="text-center" data-hygraph-field-api-id="nutrition.sugar" data-hygraph-entry-id="${recipe.id}">
               <div class="text-3xl font-light text-gray-900 mb-1">${recipe.nutrition.sugar}g</div>
               <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Sugar</div>
             </div>
             <div class="text-center" data-hygraph-field-api-id="nutrition.sodium" data-hygraph-entry-id="${recipe.id}">
               <div class="text-3xl font-light text-gray-900 mb-1">${recipe.nutrition.sodium}mg</div>
               <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">Sodium</div>
             </div>
           </div>
         </section>`
      : '';

    // Generate reviews section
    const reviews = recipe.reviews && recipe.reviews.length > 0
      ? `<section class="mt-16" data-hygraph-field-api-id="reviews">
           <h2 class="text-3xl font-light text-gray-900 mb-8">Reviews</h2>
           <div class="space-y-8">
             ${recipe.reviews.map(review =>
               `<div class="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 hover:shadow-md transition-shadow duration-300">
                  <div class="flex items-start justify-between mb-4">
                    <h4 class="text-lg font-medium text-gray-900">${review.reviewerName}</h4>
                    <div class="flex items-center space-x-1">
                      ${Array.from({ length: 5 }).map((_, i) =>
                        `<span class="text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}">⭐</span>`
                      ).join('')}
                    </div>
                  </div>
                  <p class="text-gray-600 leading-relaxed mb-3">${review.comment.text}</p>
                  <p class="text-sm text-gray-400">
                    ${new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>`
             ).join('')}
           </div>
         </section>`
      : '';

    // Generate gallery section
    const gallery = recipe.gallery && recipe.gallery.length > 0
      ? `<section class="mt-16" data-hygraph-field-api-id="gallery">
           <h2 class="text-3xl font-light text-gray-900 mb-8">Photo Gallery</h2>
           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             ${recipe.gallery.map(image =>
               `<div class="group aspect-square relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300" data-hygraph-entry-id="${recipe.id}" data-hygraph-field-api-id="gallery">
                  <img
                    src="${image.url}"
                    alt="${image.fileName}"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>`
             ).join('')}
           </div>
         </section>`
      : '';

    // Generate author section
    const author = recipe.author
      ? `<section class="mt-16 bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8" data-hygraph-field-api-id="author">
           <h2 class="text-3xl font-light text-gray-900 mb-8">About the Chef</h2>
           <div class="flex items-start space-x-6">
             ${recipe.author.profilePhoto ? `
               <div class="flex-shrink-0">
                 <img
                   src="${recipe.author.profilePhoto.url}"
                   alt="${recipe.author.name}"
                   class="w-20 h-20 rounded-full shadow-lg"
                   loading="lazy"
                 />
               </div>
             ` : ''}
             <div>
               <h3 class="text-2xl font-medium text-gray-900 mb-2">${recipe.author.name}</h3>
               ${recipe.author.specialty ? `<p class="text-gray-600 text-sm font-medium mb-3 uppercase tracking-wide">${recipe.author.specialty}</p>` : ''}
               <p class="text-gray-600 leading-relaxed">${recipe.author.bio.text}</p>
             </div>
           </div>
         </section>`
      : '';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${recipe.title} - Hygraph Recipe Example</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .recipe-image {
      transition: transform 0.3s ease;
    }
  </style>
</head>
<body class="min-h-screen bg-white">
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="bg-gradient-to-b from-gray-50 to-white">
      <div class="max-w-6xl mx-auto px-6 py-16">
        <div class="mb-8">
          <a href="/" class="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Recipes
          </a>
        </div>

        <div class="grid lg:grid-cols-2 gap-12 items-start">
          <!-- Hero Image -->
          ${heroImage}

          <div class="lg:pl-8">
            <h1 class="text-5xl font-light text-gray-900 mb-6 leading-tight" data-hygraph-field-api-id="title" data-hygraph-entry-id="${recipe.id}">
              ${recipe.title}
            </h1>

            <div class="prose prose-xl prose-gray mb-8 text-gray-600 leading-relaxed" data-hygraph-field-api-id="description" data-hygraph-entry-id="${recipe.id}">
              ${recipe.description.html}
            </div>

            <!-- Recipe Meta -->
            ${metaItems ? `<div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">${metaItems}</div>` : ''}

            <!-- Categories -->
            ${categories}
          </div>
        </div>
      </div>
    </section>

    <!-- Content -->
    <main class="max-w-6xl mx-auto px-6 py-16">
      <div class="grid lg:grid-cols-3 gap-16">
        <!-- Ingredients -->
        <div class="lg:col-span-1">
          <h2 class="text-3xl font-light text-gray-900 mb-8">Ingredients</h2>
          ${ingredients}
        </div>

        <!-- Instructions -->
        <div class="lg:col-span-2">
          <h2 class="text-3xl font-light text-gray-900 mb-8">Instructions</h2>
          ${recipeSteps}
        </div>
      </div>

      <!-- Nutrition Info -->
      ${nutrition}

      <!-- Reviews -->
      ${reviews}

      <!-- Gallery -->
      ${gallery}

      <!-- Author -->
      ${author}
    </main>
  </div>

  <script src="/js/preview-sdk.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.HygraphPreviewSDK && window.HygraphPreviewSDK.Preview) {
        const preview = new window.HygraphPreviewSDK.Preview({
          endpoint: '${CONFIG.HYGRAPH_ENDPOINT}',
          debug: ${CONFIG.PREVIEW_DEBUG},
          studioUrl: '${CONFIG.HYGRAPH_STUDIO_URL}',
          overlayEnabled: true
        });

        console.log('Live Preview initialized', preview.getVersion());
      } else {
        console.error('Live Preview not loaded');
      }
    });
  </script>
</body>
</html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Failed to load recipe:', error);
    res.status(500).send('Error loading recipe');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Vanilla HTML Recipe App running on http://localhost:${PORT}`);
});