# Hygraph Project Bootstrap

This example shows how to seed a Hygraph project with the recipe schema that ships with the Preview SDK demos. It uses Hygraph's Management API to submit a batch migration defined in `schema.json`.

## Prerequisites

- Node.js 18 or newer (for built-in `fetch`)
- A Hygraph **Permanent Auth Token** with the `Content Model` scope
- The target project environment ID (Project Settings → Environments)

## Setup

1. Duplicate `.env.example` to `.env` inside this folder and fill in the required values:
   - `HYGRAPH_MANAGEMENT_TOKEN` - create a PAT with all management api permission in your settings view
   - `HYGRAPH_ENVIRONMENT_ID`  - you can pick the environment id from the url of your studio project (second url parameter)
   - `HYGRAPH_MANAGEMENT_API` - copy it from the settings view - endpoints
2. Install dependencies at the repo root if you have not already (`npm install`).

## Run the migration

```bash
cd examples/project-setup
node bootstrap.js
```

The script will read `schema.json`, submit it as a batch migration, and print the resulting migration ID and status. Any GraphQL errors or user errors returned by the API are surfaced in the terminal output.

