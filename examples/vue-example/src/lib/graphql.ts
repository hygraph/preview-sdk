const HYGRAPH_ENDPOINT = import.meta.env.VITE_HYGRAPH_ENDPOINT!;
const HYGRAPH_TOKEN = import.meta.env.VITE_HYGRAPH_TOKEN!;

export async function graphqlRequest<T = any>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  const response = await fetch(HYGRAPH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(HYGRAPH_TOKEN && { Authorization: `Bearer ${HYGRAPH_TOKEN}` }),
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
}

// Schema exploration queries
export const SCHEMA_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType {
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  }
`;

// Simple query to test connection and discover available models
export const TEST_QUERY = `
  query TestQuery {
    __schema {
      types {
        name
        kind
      }
    }
  }
`;