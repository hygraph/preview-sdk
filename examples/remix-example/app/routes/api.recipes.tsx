import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { graphqlRequest } from "../lib/graphql";
import { GET_RECIPES_QUERY } from "../lib/queries";
import type { Recipe } from "../lib/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const first = parseInt(url.searchParams.get('first') || '10', 10);

  try {
    const data = await graphqlRequest<{ recipes: Recipe[] }>(GET_RECIPES_QUERY, { first });
    return json({ recipes: data.recipes || [] });
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    return json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}