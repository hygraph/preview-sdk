# Vanilla HTML Example

Express server with vanilla HTML/JS showing Hygraph Preview SDK integration.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Update endpoint in `server.js`:
   ```javascript
   const HYGRAPH_ENDPOINT = 'https://your-region.cdn.hygraph.com/content/your-project-id/master';
   ```

3. Run the server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:4504](http://localhost:4504)

## How It Works

The server fetches data from Hygraph and renders HTML pages. The SDK is included via script tag for preview functionality.

## Testing

**Standalone:** Open in your browser, hover over content to see edit buttons.

**Studio Integration:** Use this URL in your Hygraph preview settings.

## Schema

Uses the recipe schema from `../schema.json`. See main examples README for setup.
