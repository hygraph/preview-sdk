import { json } from "@remix-run/node";
import { graphqlRequest, SCHEMA_QUERY } from "../lib/graphql";

export async function loader() {
  try {
    const data = await graphqlRequest(SCHEMA_QUERY);
    return json(data);
  } catch (error) {
    console.error('Failed to fetch schema:', error);
    return json({ error: 'Failed to fetch schema' }, { status: 500 });
  }
}