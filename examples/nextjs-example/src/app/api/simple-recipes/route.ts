import { NextResponse } from 'next/server';

const HYGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT!;
const HYGRAPH_TOKEN = process.env.HYGRAPH_TOKEN!;

export async function GET() {
  try {
    // Simple query to see what fields exist on Recipe
    const simpleQuery = `
      query GetSimpleRecipes {
        recipes(stage: DRAFT, first: 3) {
          id
          title
          description {
            text
            html
          }
          slug
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
        query: simpleQuery,
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