import { NextResponse } from 'next/server';

const HYGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT!;
const HYGRAPH_TOKEN = process.env.HYGRAPH_TOKEN!;

export async function GET() {
  try {
    // Let's try to query the recipe content models
    const recipesQuery = `
      query GetRecipes {
        recipes(stage: DRAFT) {
          id
          title
          description
          preparationTime
          cookingTime
          servings
          difficulty
          cuisineType
          slug
          featuredImage {
            id
            url
            fileName
            width
            height
          }
          author {
            id
            name
            bio
            avatar {
              url
            }
          }
          categories {
            id
            name
            slug
          }
          ingredients {
            id
            amount
            unit
            ingredient {
              id
              name
            }
          }
          steps {
            id
            stepNumber
            instruction
            duration
            image {
              url
            }
          }
          reviews {
            id
            rating
            comment
            reviewerName
          }
          nutritionInfo {
            id
            calories
            protein
            carbs
            fat
            fiber
          }
        }
      }
    `;

    const response = await fetch(HYGRAPH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HYGRAPH_TOKEN && { Authorization: `Bearer ${HYGRAPH_TOKEN}` }),
      },
      body: JSON.stringify({
        query: recipesQuery,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      return NextResponse.json({ error: result.errors }, { status: 400 });
    }

    return NextResponse.json({ recipes: result.data.recipes });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch recipes',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}