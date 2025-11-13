import { NextResponse } from 'next/server';

const HYGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT!;
const HYGRAPH_TOKEN = process.env.HYGRAPH_TOKEN!;

export async function GET() {
  try {
    // First, let's discover available query fields (content models)
    const schemaQuery = `
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
              description
            }
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
        query: schemaQuery,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      return NextResponse.json({ error: result.errors }, { status: 400 });
    }

    // Filter to find content models (typically plural names that aren't system fields)
    interface SchemaField {
      name: string;
      type: {
        kind: string;
        name?: string;
        ofType?: {
          name?: string;
        };
      };
      description?: string;
    }
    
    const contentModels = (result.data.__schema.queryType.fields as SchemaField[])
      .filter((field) =>
        // Look for plural fields that might be content collections
        field.name !== '__schema' &&
        field.name !== '__type' &&
        !field.name.startsWith('_') &&
        field.type.kind === 'NON_NULL'
      )
      .map((field) => ({
        name: field.name,
        type: field.type.ofType?.name || field.type.name,
        description: field.description
      }));

    return NextResponse.json({ contentModels, fullSchema: result.data });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch schema',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}