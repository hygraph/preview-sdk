#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_ENV_PATH = resolve(__dirname, '.env');

function loadEnv(envPath = DEFAULT_ENV_PATH) {
  if (!existsSync(envPath)) {
    return;
  }

  const file = readFileSync(envPath, 'utf-8');
  const lines = file.split(/\r?\n/);

  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }

    const index = line.indexOf('=');
    if (index === -1) {
      continue;
    }

    const key = line.slice(0, index).trim();
    if (!key || process.env[key]) {
      continue;
    }

    const rawValue = line.slice(index + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    process.env[key] = value;
  }
}

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable "${name}".`);
  }

  return value;
}

async function submitBatchChanges() {
  loadEnv();

  const managementApi = getRequiredEnv('HYGRAPH_MANAGEMENT_API');
  const managementToken = getRequiredEnv('HYGRAPH_MANAGEMENT_TOKEN');
  const environmentId = getRequiredEnv('HYGRAPH_ENVIRONMENT_ID');
  const migrationName =
    process.env.HYGRAPH_MIGRATION_NAME?.trim() ||
    `preview-sdk-batch-${new Date().toISOString()}`;

  const schemaPath =
    process.env.HYGRAPH_SCHEMA_PATH?.trim() ||
    resolve(__dirname, 'schema.json');

  if (!existsSync(schemaPath)) {
    throw new Error(
      `Could not find schema file at "${schemaPath}". ` +
        'Set HYGRAPH_SCHEMA_PATH to override the location.'
    );
  }

  const schemaContents = readFileSync(schemaPath, 'utf-8');
  let changes;

  try {
    changes = JSON.parse(schemaContents);
  } catch (error) {
    throw new Error(
      `Failed to parse schema JSON at "${schemaPath}": ${error.message}`
    );
  }

  if (!Array.isArray(changes)) {
    throw new Error(
      `Schema file must contain a JSON array of changes. Received: ${typeof changes}`
    );
  }

  const mutation = `
    mutation SubmitBatch($data: BatchMigrationInput!) {
      submitBatchChanges(data: $data) {
        migration {
          id
          status
        }
      }
    }
  `;

  const variables = {
    data: {
      environmentId,
      name: migrationName,
      changes,
    },
  };

  const response = await fetch(managementApi, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${managementToken}`,
    },
    body: JSON.stringify({
      query: mutation,
      variables,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Management API request failed with status ${response.status}: ${text}`
    );
  }

  const result = await response.json();

  if (result.errors?.length) {
    const messages = result.errors.map((err) => err.message).join('\n');
    throw new Error(`GraphQL errors encountered:\n${messages}`);
  }

  const { migration, userErrors } = result.data?.submitBatchChanges ?? {};

  if (userErrors?.length) {
    const messages = userErrors
      .map((err) => `${err.code ?? 'UNKNOWN'}: ${err.message}`)
      .join('\n');
    throw new Error(`Migration user errors:\n${messages}`);
  }

  if (!migration) {
    throw new Error('Migration response did not include migration details.');
  }

  console.log('Migration submitted successfully:');
  console.log(`  ID: ${migration.id}`);
  console.log(`  Status: ${migration.status}`);
}

submitBatchChanges().catch((error) => {
  console.error('[hygraph-project-setup] Failed to submit batch changes:');
  console.error(error.message);
  process.exitCode = 1;
});


