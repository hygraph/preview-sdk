# Examples

This directory contains working examples of the Hygraph Preview SDK integrated with different frameworks.

## Available Examples

- **[Next.js App Router](nextjs-example/)** - Next.js 13+ with App Router
- **[Remix](remix-example/)** - Remix with server-side rendering
- **[Vue 3](vue-example/)** - Vue 3 with Vue Router
- **[Vanilla HTML](vanilla-html-example/)** - Express server with vanilla JavaScript

## Schema Setup

All examples use the same Hygraph content schema defined in [`schema.json`](schema.json). This schema includes:

- **Recipe** model with fields for title, description, ingredients, steps, etc.
- **Author** model for recipe authors
- **Category** model for categorizing recipes
- **Review** component for recipe ratings and comments

### Setting Up Your Hygraph Project

To run the examples, you need a Hygraph project with this schema:

#### Option 1: Manual Setup

1. Create a new project at [app.hygraph.com](https://app.hygraph.com)
2. Go to Schema → Models
3. Create the models as defined in `schema.json`:
   - Recipe (with fields: title, slug, description, ingredients, prepTime, etc.)
   - Author (with fields: name, bio, specialty, profilePhoto)
   - Category (with fields: name, slug, description)
   - Review component (with fields: rating, comment, reviewer)

#### Option 2: Using Hygraph Management API

You can use the Hygraph Management API to programmatically create the schema. See [Hygraph docs](https://hygraph.com/docs/api-reference/management-api) for details.

### Adding Sample Content

After creating the schema, add some sample recipes:

1. Go to Content in your Hygraph project
2. Create a few Authors
3. Create a few Categories
4. Create some Recipes with:
   - Title and description
   - At least one ingredient
   - At least one preparation step
   - Link to an author
   - Link to one or more categories
   - Optional: Add a hero image

## Running the Examples

Each example has its own README with setup instructions. General steps:

1. **Choose an example** and navigate to its directory
2. **Install dependencies**: `npm install`
3. **Set up environment variables**:
   ```bash
   # Copy the example env file
   cp .env.example .env.local

   # Edit and add your Hygraph endpoint
   ```
4. **Run the development server**: `npm run dev`
5. **Open in browser** and hover over content to see edit buttons

## Environment Variables

Each example requires these environment variables:

### Next.js
```bash
NEXT_PUBLIC_HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/your-project-id/master
NEXT_PUBLIC_HYGRAPH_STUDIO_URL=https://app.hygraph.com
HYGRAPH_TOKEN=your-permanent-auth-token  # Optional: Required if your project uses authentication
```

### Remix
```bash
HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/your-project-id/master
HYGRAPH_STUDIO_URL=https://app.hygraph.com
```

### Vue
```bash
VITE_HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/your-project-id/master
VITE_HYGRAPH_STUDIO_URL=https://app.hygraph.com
```

### Vanilla
Edit `server.js` and update:
```javascript
const HYGRAPH_ENDPOINT = 'your-endpoint-here';
```

## Testing the Preview SDK

### Standalone Mode

1. Run the example in development mode
2. Open in your browser
3. Hover over content elements (titles, descriptions, etc.)
4. Click the edit button - it should open Hygraph in a new tab

### Studio Integration

1. In your Hygraph project, go to Settings → Preview URLs
2. Add a preview URL pointing to your local server (e.g., `http://localhost:4500`)
3. Open a Recipe entry in Hygraph
4. Click "Open Preview"
5. Your preview should load inside Studio
6. Click edit buttons - they should focus the field in Studio (no new tab)

## Ports

Each example runs on a different port to avoid conflicts:

- Next.js: `http://localhost:4500`
- Remix: `http://localhost:4501`
- Vue: `http://localhost:4502`
- Vanilla: `http://localhost:4504`

## Troubleshooting

**Edit buttons not showing up?**
- Check that your environment variables are set correctly
- Verify you have `data-hygraph-entry-id` on your elements
- Enable debug mode to see console logs

**Preview not refreshing on save?**
- Make sure your `onSave` callback is set up correctly
- Check that your framework refresh method works (e.g., `router.refresh()`)

**Schema mismatch errors?**
- Verify your Hygraph schema matches the schema in `schema.json`
- Check field API IDs match exactly

## Questions?

- Check the [main documentation](../docs/)
- Open an issue on [GitHub](https://github.com/hygraph/preview-sdk/issues)
- Contact [Hygraph support](https://hygraph.com/support)
