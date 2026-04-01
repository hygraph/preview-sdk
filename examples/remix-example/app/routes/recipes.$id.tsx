import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { createComponentChainLink, createPreviewAttributes, withFieldPath } from "@hygraph/preview-sdk/core";
import { graphqlRequest } from "../lib/graphql";
import { GET_RECIPE_BY_ID_QUERY } from "../lib/queries";
import type { Recipe } from "../lib/types";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  console.log('Recipe loader called with ID:', id);

  if (!id) {
    console.log('No ID provided, throwing 404');
    throw new Response("Recipe not found", { status: 404 });
  }

  try {
    console.log('Fetching recipe with ID:', id);
    const data = await graphqlRequest<{ recipe: Recipe | null }>(GET_RECIPE_BY_ID_QUERY, { id });
    console.log('GraphQL response:', data);

    if (!data.recipe) {
      console.log('No recipe found for ID:', id);
      throw new Response("Recipe not found", { status: 404 });
    }

    console.log('Recipe found successfully:', data.recipe.title);
    return json({ recipe: data.recipe });
  } catch (error) {
    console.error('Failed to fetch recipe:', error);
    throw new Response("Recipe not found", { status: 404 });
  }
}

export default function RecipePage() {
  const { recipe } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-900 via-gray-800 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors duration-200 group">
              <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Recipes
            </Link>
          </div>

          {/* Entry ID inheritance: children with field-api-id inherit entry-id from this parent */}
          <div className="grid lg:grid-cols-2 gap-12 items-start" data-hygraph-entry-id={recipe.id}>
            {/* Hero Image */}
            {recipe.heroImage && (
              <div data-hygraph-field-api-id="heroImage">
                <div className="aspect-[4/3] relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <img
                    src={recipe.heroImage.url}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="lg:pl-8">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight" data-hygraph-field-api-id="title">
                {recipe.title}
              </h1>

              {/* Rich Text field with HTML format preference */}
              <div className="prose prose-xl prose-invert mb-8 text-gray-300 leading-relaxed" data-hygraph-field-api-id="description" data-hygraph-rich-text-format="html">
                <div dangerouslySetInnerHTML={{ __html: recipe.description.html }} />
              </div>

              {/* Recipe Meta */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {recipe.prepTime && (
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg ring-1 ring-white/10 hover:ring-white/20 hover:bg-gray-800/80 transition-all" data-hygraph-field-api-id="prepTime">
                    <div className="text-3xl mb-3">⏱️</div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Prep Time</div>
                    <div className="text-2xl font-bold text-white">{recipe.prepTime}<span className="text-sm font-normal text-gray-400">min</span></div>
                  </div>
                )}
                {recipe.cookTime && (
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg ring-1 ring-white/10 hover:ring-white/20 hover:bg-gray-800/80 transition-all" data-hygraph-field-api-id="cookTime">
                    <div className="text-3xl mb-3">🔥</div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cook Time</div>
                    <div className="text-2xl font-bold text-white">{recipe.cookTime}<span className="text-sm font-normal text-gray-400">min</span></div>
                  </div>
                )}
                {recipe.servings && (
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg ring-1 ring-white/10 hover:ring-white/20 hover:bg-gray-800/80 transition-all" data-hygraph-field-api-id="servings">
                    <div className="text-3xl mb-3">🍽️</div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Servings</div>
                    <div className="text-2xl font-bold text-white">{recipe.servings}</div>
                  </div>
                )}
                {recipe.difficulty && (
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg ring-1 ring-white/10 hover:ring-white/20 hover:bg-gray-800/80 transition-all" data-hygraph-field-api-id="difficulty">
                    <div className="text-3xl mb-3">📊</div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Difficulty</div>
                    <div className="text-2xl font-bold text-white">{recipe.difficulty}</div>
                  </div>
                )}
              </div>

              {/* Categories */}
              {recipe.categories && recipe.categories.length > 0 && (
                <div className="mb-8" data-hygraph-field-api-id="categories">
                  <div className="flex flex-wrap gap-3">
                    {recipe.categories.map((category) => (
                      <span
                        key={category.id}
                        className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-full hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-200 ring-1 ring-blue-400/30"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Ingredients */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <h2 className="text-3xl font-bold text-white mb-6">Ingredients</h2>
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              <div
                className="space-y-4"
                {...withFieldPath(
                  createPreviewAttributes({ entryId: recipe.id, fieldApiId: 'ingredients' }),
                  'ingredients'
                )}
              >
                {recipe.ingredients.map((ingredient, index) => {
                  const chain = [createComponentChainLink('ingredients', ingredient.id)];
                  const basePath = `ingredients.${index}`;
                  const quantityAttributes = withFieldPath(
                    createPreviewAttributes({
                      entryId: recipe.id,
                      fieldApiId: 'quantity',
                      componentChain: chain,
                    }),
                    `${basePath}.quantity`
                  );
                  const unitAttributes = withFieldPath(
                    createPreviewAttributes({
                      entryId: recipe.id,
                      fieldApiId: 'unit',
                      componentChain: chain,
                    }),
                    `${basePath}.unit`
                  );

                  return (
                    <div
                      key={`${ingredient.id}-${index}`}
                      className="group hover:bg-gray-800/50 rounded-2xl p-4 transition-all duration-200 border border-gray-700/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-100 text-base">
                          {ingredient.ingredient.name}
                        </span>
                        <div className="flex items-baseline gap-1 ml-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1.5 rounded-full ring-1 ring-blue-400/30">
                          <span className="text-base font-bold text-white" {...quantityAttributes}>
                            {ingredient.quantity}
                          </span>
                          <span
                            className="text-xs font-medium text-gray-300"
                            {...unitAttributes}
                          >
                            {ingredient.unit.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">No ingredients listed.</p>
            )}
            </div>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-white mb-8">Instructions</h2>
            {recipe.recipeSteps && recipe.recipeSteps.length > 0 ? (
              <div
                className="space-y-8"
                {...withFieldPath(
                  createPreviewAttributes({ entryId: recipe.id, fieldApiId: 'recipeSteps' }),
                  'recipeSteps'
                )}
              >
                {recipe.recipeSteps.map((step, index) => {
                  const chain = [createComponentChainLink('recipeSteps', step.id)];
                  const stepBasePath = `recipeSteps.${index}`;
                  const stepNumberAttributes = withFieldPath(
                    createPreviewAttributes({
                      entryId: recipe.id,
                      fieldApiId: 'stepNumber',
                      componentChain: chain,
                    }),
                    `${stepBasePath}.stepNumber`
                  );
                  const stepTitleAttributes = withFieldPath(
                    createPreviewAttributes({
                      entryId: recipe.id,
                      fieldApiId: 'title',
                      componentChain: chain,
                    }),
                    `${stepBasePath}.title`
                  );
                  const instructionAttributes = withFieldPath(
                    createPreviewAttributes({
                      entryId: recipe.id,
                      fieldApiId: 'instruction',
                      componentChain: chain,
                    }),
                    `${stepBasePath}.instruction`
                  );
                  const estimatedTimeAttributes = withFieldPath(
                    createPreviewAttributes({
                      entryId: recipe.id,
                      fieldApiId: 'estimatedTime',
                      componentChain: chain,
                    }),
                    `${stepBasePath}.estimatedTime`
                  );

                  return (
                    <div key={`step-${step.stepNumber}-${index}`} className="group bg-gray-800/30 backdrop-blur-sm rounded-3xl p-8 shadow-xl ring-1 ring-white/10 hover:ring-white/20 hover:bg-gray-800/50 transition-all duration-300">
                      <div className="flex items-start space-x-6">
                        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md">
                          <span {...stepNumberAttributes}>
                            {step.stepNumber}
                          </span>
                        </div>
                        <div className="flex-1">
                          {step.title && (
                            <h3
                              className="text-2xl font-bold text-white mb-4"
                              {...stepTitleAttributes}
                            >
                              {step.title}
                            </h3>
                          )}
                          <div
                            className="prose prose-lg prose-invert max-w-none text-gray-300 leading-relaxed mb-4"
                            {...instructionAttributes}
                            data-hygraph-rich-text-format="html"
                          >
                            <div dangerouslySetInnerHTML={{ __html: step.instruction.html }} />
                          </div>
                          {step.estimatedTime && (
                            <div
                              className="inline-flex items-center mt-4 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 rounded-xl text-sm font-semibold text-blue-300"
                              {...estimatedTimeAttributes}
                            >
                              <span className="mr-2 text-base">⏱️</span>
                              {step.estimatedTime} minutes
                            </div>
                          )}

                          {/* Nested Components: Equipment, Ingredients Used, Tips */}
                          <div className="mt-6 space-y-4">
                            {/* Equipment */}
                            {step.equipment && step.equipment.length > 0 && (
                              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-400/30">
                                <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
                                  <span className="mr-2">🔧</span>
                                  Equipment Needed
                                </h4>
                                <div className="space-y-2">
                                  {step.equipment.map((equip, equipIndex) => {
                                    const equipChain = [
                                      createComponentChainLink('recipeSteps', step.id),
                                      createComponentChainLink('equipment', equip.id)
                                    ];
                                    const equipBasePath = `${stepBasePath}.equipment.${equipIndex}`;
                                    return (
                                      <div key={equip.id} className="bg-gray-900/40 backdrop-blur-sm rounded-md p-3">
                                        <div className="flex items-start justify-between">
                                          <span
                                            className="font-medium text-gray-100"
                                            {...withFieldPath(
                                              createPreviewAttributes({
                                                entryId: recipe.id,
                                                fieldApiId: 'name',
                                                componentChain: equipChain,
                                              }),
                                              `${equipBasePath}.name`
                                            )}
                                          >
                                            {equip.name}
                                          </span>
                                          {equip.required && (
                                            <span
                                              className="text-xs bg-blue-500/30 text-blue-300 px-2 py-1 rounded-full font-medium"
                                              {...withFieldPath(
                                                createPreviewAttributes({
                                                  entryId: recipe.id,
                                                  fieldApiId: 'required',
                                                  componentChain: equipChain,
                                                }),
                                                `${equipBasePath}.required`
                                              )}
                                            >
                                              Required
                                            </span>
                                          )}
                                        </div>
                                        {equip.alternatives && (
                                          <p
                                            className="text-sm text-gray-300 mt-1"
                                            {...withFieldPath(
                                              createPreviewAttributes({
                                                entryId: recipe.id,
                                                fieldApiId: 'alternatives',
                                                componentChain: equipChain,
                                              }),
                                              `${equipBasePath}.alternatives`
                                            )}
                                          >
                                            <span className="font-medium">Alternative:</span> {equip.alternatives}
                                          </p>
                                        )}
                                        {equip.notes && (
                                          <div
                                            className="text-sm text-gray-300 mt-2 prose prose-sm prose-invert"
                                            {...withFieldPath(
                                              createPreviewAttributes({
                                                entryId: recipe.id,
                                                fieldApiId: 'notes',
                                                componentChain: equipChain,
                                              }),
                                              `${equipBasePath}.notes`
                                            )}
                                            data-hygraph-rich-text-format="html"
                                          >
                                            <div dangerouslySetInnerHTML={{ __html: equip.notes.html }} />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Ingredients Used */}
                            {step.ingredientsUsed && step.ingredientsUsed.length > 0 && (
                              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-400/30">
                                <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
                                  <span className="mr-2">🥗</span>
                                  Ingredients for This Step
                                </h4>
                                <div className="space-y-2">
                                  {step.ingredientsUsed.map((ingred, ingredIndex) => {
                                    const ingredChain = [
                                      createComponentChainLink('recipeSteps', step.id),
                                      createComponentChainLink('ingredientsUsed', ingred.id)
                                    ];
                                    const ingredBasePath = `${stepBasePath}.ingredientsUsed.${ingredIndex}`;
                                    return (
                                      <div key={ingred.id} className="bg-gray-900/40 backdrop-blur-sm rounded-md p-3">
                                        <span
                                          className="font-medium text-gray-100 block"
                                          {...withFieldPath(
                                            createPreviewAttributes({
                                              entryId: recipe.id,
                                              fieldApiId: 'ingredientName',
                                              componentChain: ingredChain,
                                            }),
                                            `${ingredBasePath}.ingredientName`
                                          )}
                                        >
                                          {ingred.ingredientName}
                                        </span>
                                        {ingred.preparation && (
                                          <p
                                            className="text-sm text-gray-300 mt-1"
                                            {...withFieldPath(
                                              createPreviewAttributes({
                                                entryId: recipe.id,
                                                fieldApiId: 'preparation',
                                                componentChain: ingredChain,
                                              }),
                                              `${ingredBasePath}.preparation`
                                            )}
                                          >
                                            <span className="font-medium">Prep:</span> {ingred.preparation}
                                          </p>
                                        )}
                                        {ingred.timing && (
                                          <p
                                            className="text-sm text-gray-300 mt-1"
                                            {...withFieldPath(
                                              createPreviewAttributes({
                                                entryId: recipe.id,
                                                fieldApiId: 'timing',
                                                componentChain: ingredChain,
                                              }),
                                              `${ingredBasePath}.timing`
                                            )}
                                          >
                                            <span className="font-medium">When:</span> {ingred.timing}
                                          </p>
                                        )}
                                        {ingred.notes && (
                                          <div
                                            className="text-sm text-gray-300 mt-2 prose prose-sm prose-invert"
                                            {...withFieldPath(
                                              createPreviewAttributes({
                                                entryId: recipe.id,
                                                fieldApiId: 'notes',
                                                componentChain: ingredChain,
                                              }),
                                              `${ingredBasePath}.notes`
                                            )}
                                            data-hygraph-rich-text-format="html"
                                          >
                                            <div dangerouslySetInnerHTML={{ __html: ingred.notes.html }} />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Tips */}
                            {step.tips && step.tips.length > 0 && (
                              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-lg p-4 border border-yellow-400/30">
                                <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
                                  <span className="mr-2">💡</span>
                                  Pro Tips
                                </h4>
                                <div className="space-y-3">
                                  {step.tips.map((tip, tipIndex) => {
                                    const tipChain = [
                                      createComponentChainLink('recipeSteps', step.id),
                                      createComponentChainLink('tips', tip.id)
                                    ];
                                    const tipBasePath = `${stepBasePath}.tips.${tipIndex}`;
                                    return (
                                      <div key={tip.id} className="bg-gray-900/40 backdrop-blur-sm rounded-md p-3">
                                        <div className="flex items-start space-x-3">
                                          {tip.icon && (
                                            <span
                                              className="text-xl flex-shrink-0"
                                              {...withFieldPath(
                                                createPreviewAttributes({
                                                  entryId: recipe.id,
                                                  fieldApiId: 'icon',
                                                  componentChain: tipChain,
                                                }),
                                                `${tipBasePath}.icon`
                                              )}
                                            >
                                              {tip.icon}
                                            </span>
                                          )}
                                          <div className="flex-1">
                                            <h5
                                              className="font-medium text-gray-100 mb-1"
                                              {...withFieldPath(
                                                createPreviewAttributes({
                                                  entryId: recipe.id,
                                                  fieldApiId: 'title',
                                                  componentChain: tipChain,
                                                }),
                                                `${tipBasePath}.title`
                                              )}
                                            >
                                              {tip.title}
                                            </h5>
                                            <div
                                              className="text-sm text-gray-300 prose prose-sm prose-invert"
                                              {...withFieldPath(
                                                createPreviewAttributes({
                                                  entryId: recipe.id,
                                                  fieldApiId: 'content',
                                                  componentChain: tipChain,
                                                }),
                                                `${tipBasePath}.content`
                                              )}
                                              data-hygraph-rich-text-format="html"
                                            >
                                              <div dangerouslySetInnerHTML={{ __html: tip.content.html }} />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">No instructions available.</p>
            )}
          </div>
        </div>

        {/* Nutrition Info */}
        {recipe.nutrition && (
          <section className="mt-16 bg-gray-800/30 backdrop-blur-sm rounded-3xl p-8 ring-1 ring-white/10" data-hygraph-field-api-id="nutrition" data-hygraph-entry-id={recipe.id}>
            <h2 className="text-3xl font-bold text-white mb-8">Nutrition Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center" data-hygraph-field-api-id="nutrition.calories" data-hygraph-entry-id={recipe.id}>
                <div className="text-3xl font-bold text-white mb-1">{recipe.nutrition.calories}</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Calories</div>
              </div>
              <div className="text-center" data-hygraph-field-api-id="nutrition.protein" data-hygraph-entry-id={recipe.id}>
                <div className="text-3xl font-bold text-white mb-1">{recipe.nutrition.protein}g</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Protein</div>
              </div>
              <div className="text-center" data-hygraph-field-api-id="nutrition.carbohydrates" data-hygraph-entry-id={recipe.id}>
                <div className="text-3xl font-bold text-white mb-1">{recipe.nutrition.carbohydrates}g</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Carbs</div>
              </div>
              <div className="text-center" data-hygraph-field-api-id="nutrition.fat" data-hygraph-entry-id={recipe.id}>
                <div className="text-3xl font-bold text-white mb-1">{recipe.nutrition.fat}g</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Fat</div>
              </div>
              <div className="text-center" data-hygraph-field-api-id="nutrition.fiber" data-hygraph-entry-id={recipe.id}>
                <div className="text-3xl font-bold text-white mb-1">{recipe.nutrition.fiber}g</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Fiber</div>
              </div>
              <div className="text-center" data-hygraph-field-api-id="nutrition.sugar" data-hygraph-entry-id={recipe.id}>
                <div className="text-3xl font-bold text-white mb-1">{recipe.nutrition.sugar}g</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Sugar</div>
              </div>
              <div className="text-center" data-hygraph-field-api-id="nutrition.sodium" data-hygraph-entry-id={recipe.id}>
                <div className="text-3xl font-bold text-white mb-1">{recipe.nutrition.sodium}mg</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Sodium</div>
              </div>
            </div>
          </section>
        )}

        {/* Reviews */}
        {recipe.reviews && recipe.reviews.length > 0 && (
          <section className="mt-16" data-hygraph-field-api-id="reviews">
            <h2 className="text-3xl font-light text-gray-900 mb-8">Reviews</h2>
            <div className="space-y-8">
              {recipe.reviews.map((review) => (
                <div key={review.id} className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">{review.reviewerName}</h4>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-3">{review.comment.text}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {recipe.gallery && recipe.gallery.length > 0 && (
          <section className="mt-16" data-hygraph-field-api-id="gallery">
            <h2 className="text-3xl font-light text-gray-900 mb-8">Photo Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipe.gallery.map((image) => (
                <div key={image.id} className="group aspect-square relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300" data-hygraph-entry-id={recipe.id} data-hygraph-field-api-id="gallery">
                  <img
                    src={image.url}
                    alt={image.fileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Author */}
        {recipe.author && (
          <section className="mt-16 bg-gray-800/30 backdrop-blur-sm rounded-3xl p-8 ring-1 ring-white/10" data-hygraph-field-api-id="author">
            <h2 className="text-3xl font-bold text-white mb-8">About the Chef</h2>
            <div className="flex items-start space-x-6">
              {recipe.author.profilePhoto && (
                <div className="flex-shrink-0">
                  <img
                    src={recipe.author.profilePhoto.url}
                    alt={recipe.author.name}
                    width="80"
                    height="80"
                    className="rounded-full shadow-lg ring-2 ring-white/20"
                  />
                </div>
              )}
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">{recipe.author.name}</h3>
                {recipe.author.specialty && (
                  <p className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wide">{recipe.author.specialty}</p>
                )}
                <p className="text-gray-300 leading-relaxed">{recipe.author.bio.text}</p>
              </div>
            </div>
          </section>
        )}

        {/* Featured Content (Modular Component - Single) */}
        {recipe.featuredContent && (
          <section
            className="mt-16"
            {...withFieldPath(
              createPreviewAttributes({ entryId: recipe.id, fieldApiId: 'featuredContent' }),
              'featuredContent'
            )}
          >
            <h2 className="text-3xl font-light text-gray-900 mb-8">Featured Content</h2>
            <div className="relative">
              <div className="absolute -top-2 -left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded transform -rotate-12 z-10">
                FEATURED
              </div>
              {(() => {
                const section = recipe.featuredContent;
                const chain = [createComponentChainLink('featuredContent', section.id)];
                const basePath = 'featuredContent';

                switch (section.__typename) {
                  case 'ProTip': {
                    const proTipIconAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'icon',
                        componentChain: chain,
                      }),
                      `${basePath}.icon`
                    );
                    const proTipTitleAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'title',
                        componentChain: chain,
                      }),
                      `${basePath}.title`
                    );
                    const proTipContentAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'content',
                        componentChain: chain,
                      }),
                      `${basePath}.content`
                    );
                    return (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border-2 border-yellow-200 shadow-lg">
                        <div className="flex items-start space-x-6">
                          <div className="flex-shrink-0 text-4xl" {...proTipIconAttributes}>
                            {section.icon || '⭐'}
                          </div>
                          <div className="flex-1">
                            <h3
                              className="text-2xl font-semibold text-gray-900 mb-4"
                              {...proTipTitleAttributes}
                            >
                              {section.tipTitle}
                            </h3>
                            <div
                              className="prose prose-lg prose-gray text-gray-700"
                              dangerouslySetInnerHTML={{ __html: section.tipContent.html }}
                              {...proTipContentAttributes}
                              data-hygraph-rich-text-format="html"
                            />
                        </div>
                      </div>
                    </div>
                    );
                  }

                  case 'VideoEmbed': {
                    const videoTitleAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'title',
                        componentChain: chain,
                      }),
                      `${basePath}.title`
                    );
                    const videoUrlAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'videoUrl',
                        componentChain: chain,
                      }),
                      `${basePath}.videoUrl`
                    );
                    const videoDescriptionAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'description',
                        componentChain: chain,
                      }),
                      `${basePath}.description`
                    );
                    return (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 shadow-lg">
                        <h3
                          className="text-2xl font-semibold text-gray-900 mb-6"
                          {...videoTitleAttributes}
                        >
                          {section.videoTitle}
                        </h3>
                        <div className="aspect-video bg-gray-200 rounded-xl mb-6 flex items-center justify-center shadow-inner">
                          <div className="text-center">
                            <div className="text-6xl mb-4">🎬</div>
                            <p className="text-gray-600 text-lg font-medium">Featured Video</p>
                            <p
                              className="text-gray-500 text-sm"
                              {...videoUrlAttributes}
                            >
                              {section.videoUrl}
                            </p>
                          </div>
                        </div>
                        {section.videoDescription && (
                          <div
                            className="prose prose-lg prose-gray text-gray-700"
                            dangerouslySetInnerHTML={{ __html: section.videoDescription.html }}
                            {...videoDescriptionAttributes}
                            data-hygraph-rich-text-format="html"
                          />
                        )}
                      </div>
                    );
                  }

                  case 'IngredientSpotlight': {
                    const spotlightImageAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'image',
                        componentChain: chain,
                      }),
                      `${basePath}.image`
                    );
                    const spotlightTitleAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'ingredient',
                        componentChain: chain,
                      }),
                      `${basePath}.ingredient`
                    );
                    const spotlightDescriptionAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'description',
                        componentChain: chain,
                      }),
                      `${basePath}.description`
                    );
                    const spotlightSubstitutesAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'substitutes',
                        componentChain: chain,
                      }),
                      `${basePath}.substitutes`
                    );
                    return (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 shadow-lg">
                        <div className="flex items-start space-x-8">
                          <div
                            className="flex-shrink-0"
                            {...spotlightImageAttributes}
                          >
                            {section.ingredientImage ? (
                              <img
                                src={section.ingredientImage.url}
                                alt={section.ingredient?.name || 'Ingredient'}
                                width={120}
                                height={120}
                                className="rounded-xl object-cover shadow-xl border-4 border-white"
                              />
                            ) : (
                              <div className="w-30 h-30 bg-green-200 rounded-xl flex items-center justify-center shadow-xl border-4 border-white">
                                <span className="text-4xl">🌿</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3
                              className="text-2xl font-semibold text-gray-900 mb-4"
                              {...spotlightTitleAttributes}
                            >
                              Star Ingredient: <span>{section.ingredient?.name || 'Unknown'}</span>
                            </h3>
                            <div
                              className="prose prose-lg prose-gray text-gray-700 mb-4"
                              dangerouslySetInnerHTML={{ __html: section.ingredientDescription.html }}
                              {...spotlightDescriptionAttributes}
                              data-hygraph-rich-text-format="html"
                            />
                            {section.substitutes && (
                              <div className="bg-white bg-opacity-70 rounded-lg p-4 border border-green-300">
                                <strong className="text-green-800">Alternative ingredients:</strong>{' '}
                                <span
                                  className="text-gray-700"
                                  {...spotlightSubstitutesAttributes}
                                >
                                  {section.substitutes}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  default:
                    return null;
                }
              })()}
            </div>
          </section>
        )}

        {/* Additional Sections (Modular Components - Multiple) */}
        {recipe.additionalSections && recipe.additionalSections.length > 0 && (
          <section
            className="mt-16"
            {...withFieldPath(
              createPreviewAttributes({ entryId: recipe.id, fieldApiId: 'additionalSections' }),
              'additionalSections'
            )}
          >
            <h2 className="text-3xl font-bold text-white mb-8">More Information</h2>
            <div className="space-y-6">
              {recipe.additionalSections.map((section, index) => {
                const chain = [createComponentChainLink('additionalSections', section.id)];
                const basePath = `additionalSections.${index}`;

                switch (section.__typename) {
                  case 'ProTip':
                    const proTipListIconAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'icon',
                        componentChain: chain,
                      }),
                      `${basePath}.icon`
                    );
                    const proTipListTitleAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'title',
                        componentChain: chain,
                      }),
                      `${basePath}.title`
                    );
                    const proTipListContentAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'content',
                        componentChain: chain,
                      }),
                      `${basePath}.content`
                    );
                    return (
                      <div key={section.id} className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:ring-2 hover:ring-blue-500/50 transition-all">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 text-2xl" {...proTipListIconAttributes}>
                            {section.icon || '💡'}
                          </div>
                          <div className="flex-1">
                            <h3
                              className="text-lg font-semibold text-white mb-2"
                              {...proTipListTitleAttributes}
                            >
                              {section.tipTitle}
                            </h3>
                            <div
                              className="prose prose-invert text-gray-300"
                              dangerouslySetInnerHTML={{ __html: section.tipContent.html }}
                              {...proTipListContentAttributes}
                              data-hygraph-rich-text-format="html"
                            />
                          </div>
                        </div>
                      </div>
                    );

                  case 'VideoEmbed':
                    const listVideoTitleAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'title',
                        componentChain: chain,
                      }),
                      `${basePath}.title`
                    );
                    const listVideoUrlAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'videoUrl',
                        componentChain: chain,
                      }),
                      `${basePath}.videoUrl`
                    );
                    const listVideoDescriptionAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'description',
                        componentChain: chain,
                      }),
                      `${basePath}.description`
                    );
                    return (
                      <div key={section.id} className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:ring-2 hover:ring-purple-500/50 transition-all">
                        <h3
                          className="text-lg font-semibold text-white mb-4"
                          {...listVideoTitleAttributes}
                        >
                          {section.videoTitle}
                        </h3>
                        <div className="aspect-video bg-gray-900/50 rounded-lg mb-4 overflow-hidden border border-white/10" {...listVideoUrlAttributes}>
                          {(() => {
                            const url = section.videoUrl;
                            // Extract YouTube video ID from various URL formats
                            const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                            const match = url.match(youtubeRegex);

                            if (match && match[1]) {
                              return (
                                <iframe
                                  src={`https://www.youtube.com/embed/${match[1]}`}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title={section.videoTitle}
                                />
                              );
                            }

                            // Fallback for non-YouTube URLs
                            return (
                              <div className="text-center flex items-center justify-center h-full">
                                <div>
                                  <div className="text-3xl mb-2">🎥</div>
                                  <p className="text-gray-400 text-sm">Video: {url}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        {section.videoDescription && (
                          <div
                            className="prose prose-invert text-gray-300"
                            dangerouslySetInnerHTML={{ __html: section.videoDescription.html }}
                            {...listVideoDescriptionAttributes}
                            data-hygraph-rich-text-format="html"
                          />
                        )}
                      </div>
                    );

                  case 'IngredientSpotlight':
                    const listSpotlightImageAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'image',
                        componentChain: chain,
                      }),
                      `${basePath}.image`
                    );
                    const listSpotlightTitleAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'ingredient',
                        componentChain: chain,
                      }),
                      `${basePath}.ingredient`
                    );
                    const listSpotlightDescriptionAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'description',
                        componentChain: chain,
                      }),
                      `${basePath}.description`
                    );
                    const listSpotlightSubstitutesAttributes = withFieldPath(
                      createPreviewAttributes({
                        entryId: recipe.id,
                        fieldApiId: 'substitutes',
                        componentChain: chain,
                      }),
                      `${basePath}.substitutes`
                    );
                    return (
                      <div key={section.id} className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:ring-2 hover:ring-green-500/50 transition-all">
                        <div className="flex items-start space-x-6">
                          <div
                            className="flex-shrink-0"
                            {...listSpotlightImageAttributes}
                          >
                            {section.ingredientImage ? (
                              <img
                                src={section.ingredientImage.url}
                                alt={section.ingredient?.name || 'Ingredient'}
                                width={80}
                                height={80}
                                className="rounded-lg object-cover shadow-md ring-2 ring-white/20"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-400/30">
                                <span className="text-2xl">🥬</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3
                              className="text-lg font-semibold text-white mb-2"
                              {...listSpotlightTitleAttributes}
                            >
                              Featured: <span>{section.ingredient?.name || 'Unknown'}</span>
                            </h3>
                            <div
                              className="prose prose-invert text-gray-300 mb-3"
                              dangerouslySetInnerHTML={{ __html: section.ingredientDescription.html }}
                              {...listSpotlightDescriptionAttributes}
                              data-hygraph-rich-text-format="html"
                            />
                            {section.substitutes && (
                              <div className="text-sm text-gray-400">
                                <strong>Substitutes:</strong>{' '}
                                <span {...listSpotlightSubstitutesAttributes}>
                                  {section.substitutes}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
