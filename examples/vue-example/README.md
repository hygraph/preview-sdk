# Vue Example

Vue 3 example showing Hygraph Preview SDK integration.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```bash
   VITE_HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/your-project-id/master
   VITE_HYGRAPH_STUDIO_URL=https://app.hygraph.com
   ```

3. Run the server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:4502](http://localhost:4502)

## How It Works

The wrapper component (`src/components/PreviewWrapper.vue`) uses the core SDK directly with Vue's Composition API and refreshes content when saved using `router.go(0)`.

## Testing

**Standalone:** Open in your browser, hover over content to see edit buttons.

**Studio Integration:** Use this URL in your Hygraph preview settings.

## Schema

Uses the recipe schema from `../schema.json`. See main examples README for setup.
