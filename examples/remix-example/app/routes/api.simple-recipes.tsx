import { json } from "@remix-run/node";
import { graphqlRequest } from "../lib/graphql";

// Simple query to get basic recipe data
const SIMPLE_RECIPES_QUERY = `
  query SimpleRecipes {
    recipes(stage: DRAFT, first: 5) {
      id
      title
      slug
    }
  }
`;

export async function loader() {
  try {
    const data = await graphqlRequest(SIMPLE_RECIPES_QUERY);
    return json(data);
  } catch (error) {
    console.error('Failed to fetch simple recipes:', error);
    return json({ error: 'Failed to fetch simple recipes' }, { status: 500 });
  }
}