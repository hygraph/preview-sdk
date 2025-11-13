import { GetServerSideProps } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { graphqlRequest } from '../lib/graphql';
import { GET_RECIPES_QUERY } from '../lib/queries';

interface Recipe {
  id: string;
  title: string;
  description: {
    text: string;
    html: string;
  };
  slug: string;
  difficulty?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  heroImage?: {
    id: string;
    url: string;
    fileName: string;
    width: number;
    height: number;
  };
  author?: {
    id: string;
    name: string;
    bio: {
      text: string;
    };
    specialty?: string;
    profilePhoto?: {
      id: string;
      url: string;
      width: number;
      height: number;
    };
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface PageProps {
  recipes: Recipe[];
}

export default function HomePage({ recipes }: PageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-900 via-gray-800 to-transparent border-b border-white/10" data-hygraph-entry-id="homepage-hero">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6" data-hygraph-field-api-id="heroTitle">
            Delicious Recipes
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto" data-hygraph-field-api-id="heroSubtitle">
            Discover amazing recipes from around the world. Each one carefully crafted and tested for the perfect dining experience.
          </p>
        </div>
      </section>

      {/* Recipes Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-4" data-hygraph-entry-id="recipe-section" data-hygraph-field-api-id="sectionTitle">
            Latest Recipes
          </h2>
          <p className="text-gray-400" data-hygraph-entry-id="recipe-section" data-hygraph-field-api-id="sectionDescription">
            Browse our collection of tried and tested recipes
          </p>
        </div>

        {recipes.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group block"
              >
                <article
                  className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all group-hover:ring-2 group-hover:ring-blue-500/50 h-full flex flex-col ring-1 ring-white/10"
                  data-hygraph-entry-id={recipe.id}
                >
                  {recipe.heroImage && (
                    <div className="aspect-video relative" data-hygraph-field-api-id="heroImage">
                      <Image
                        src={recipe.heroImage.url}
                        alt={recipe.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="mb-4 flex-grow">
                      {recipe.categories && recipe.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3" data-hygraph-field-api-id="categories">
                          {recipe.categories.map((category) => (
                            <span
                              key={category.id}
                              className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                            >
                              {category.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors" data-hygraph-field-api-id="title">
                        {recipe.title}
                      </h3>

                      <p className="text-gray-300 text-sm leading-relaxed mb-4" data-hygraph-field-api-id="description">
                        {recipe.description.text}
                      </p>
                    </div>

                    {/* Recipe Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-400 border-t border-gray-700 pt-4">
                      <div className="flex items-center space-x-4">
                        {recipe.prepTime && (
                          <span data-hygraph-field-api-id="prepTime">⏱️ {recipe.prepTime}min</span>
                        )}
                        {recipe.difficulty && (
                          <span data-hygraph-field-api-id="difficulty">📊 {recipe.difficulty}</span>
                        )}
                        {recipe.servings && (
                          <span data-hygraph-field-api-id="servings">🍽️ {recipe.servings}</span>
                        )}
                      </div>

                      {recipe.author && (
                        <div className="flex items-center space-x-2" data-hygraph-field-api-id="author">
                          {recipe.author.profilePhoto && (
                            <Image
                              src={recipe.author.profilePhoto.url}
                              alt={recipe.author.name}
                              width={32}
                              height={32}
                              className="rounded-full object-cover ring-2 ring-white/20"
                            />
                          )}
                          <span className="text-gray-200 font-medium">{recipe.author.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No recipes found. Check your API connection.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Fetch data on each request
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const data = await graphqlRequest<{ recipes: Recipe[] }>(GET_RECIPES_QUERY, { first: 12 });
    return {
      props: {
        recipes: data.recipes || [],
      },
    };
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    return {
      props: {
        recipes: [],
      },
    };
  }
};
