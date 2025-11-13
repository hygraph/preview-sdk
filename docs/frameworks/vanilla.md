# Vanilla JavaScript Guide

Complete guide for integrating Hygraph Preview SDK with vanilla JavaScript (no framework).

## Installation

### Via npm

```bash
npm install @hygraph/preview-sdk
```

```javascript
import { Preview } from '@hygraph/preview-sdk/core';
```

### Via CDN

```html
<script src="https://unpkg.com/@hygraph/preview-sdk/dist/index.umd.js"></script>
<script>
  const { Preview } = HygraphPreviewSDK;
</script>
```

## Setup

### Basic Usage

```javascript
// Initialize the SDK
const preview = new Preview({
  endpoint: 'https://your-region.cdn.hygraph.com/content/your-project-id/master',
  studioUrl: 'https://app.hygraph.com',
  debug: true,
});

// Subscribe to save events
preview.subscribe('save', {
  callback: (entryId) => {
    console.log('Content saved:', entryId);
    window.location.reload(); // Reload page on save
  }
});

// Clean up when done
window.addEventListener('beforeunload', () => {
  preview.destroy();
});
```

### Configure Preview URL in Hygraph Studio

1. Open your project in [Hygraph Studio](https://app.hygraph.com)
2. Navigate to **Project Settings → Preview URLs**
3. Add a preview entry that matches where your site runs (for example, `http://localhost:4504/preview/{entryId}`)
4. Save and click **Open Preview** on any entry to load your site inside Studio

If you serve the preview from a different origin or custom domain, add that URL to `allowedOrigins` and set `studioUrl` so the SDK knows which Studio instance to open when running in standalone mode.

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Site</title>
</head>
<body>
  <article data-hygraph-entry-id="cm1173r6nbngf07w5kyaxonmb">
    <h1
      data-hygraph-entry-id="cm1173r6nbngf07w5kyaxonmb"
      data-hygraph-field-api-id="title"
    >
      Article Title
    </h1>

    <p
      data-hygraph-entry-id="cm1173r6nbngf07w5kyaxonmb"
      data-hygraph-field-api-id="content"
    >
      Article content...
    </p>
  </article>

  <script type="module">
    import { Preview } from '@hygraph/preview-sdk/core';

    const preview = new Preview({
      endpoint: 'YOUR_HYGRAPH_ENDPOINT',
      debug: true,
    });

    preview.subscribe('save', {
      callback: () => window.location.reload()
    });
  </script>
</body>
</html>
```

## Server-Side Rendering

If you're using server-side rendering (e.g., Express, PHP):

```javascript
// Only initialize on client-side
if (typeof window !== 'undefined') {
  const preview = new Preview({
    endpoint: 'YOUR_ENDPOINT',
    debug: true,
  });

  preview.subscribe('save', {
    callback: () => window.location.reload()
  });
}
```

## Without Page Reload

For SPAs, you can update content without reloading:

```javascript
const preview = new Preview({
  endpoint: 'YOUR_ENDPOINT',
  debug: true,
});

preview.subscribe('save', {
  callback: async (entryId) => {
    // Fetch fresh data
    const response = await fetch(`/api/content/${entryId}`);
    const data = await response.json();

    // Update DOM
    document.querySelector(`[data-hygraph-entry-id="${entryId}"] h1`).textContent = data.title;
    document.querySelector(`[data-hygraph-entry-id="${entryId}"] p`).textContent = data.content;
  }
});
```

## Events

Listen to preview events:

```javascript
// Ready event
document.addEventListener('preview:ready', (event) => {
  console.log('Preview SDK ready');
});

// Connected to Studio
document.addEventListener('preview:connected', (event) => {
  console.log('Connected to Studio:', event.detail.studioOrigin);
});

// Content saved
document.addEventListener('preview:content-saved', (event) => {
  console.log('Content saved:', event.detail.entryId);
});

// Field clicked
document.addEventListener('preview:field-click', (event) => {
  console.log('Field clicked:', event.detail);
});
```

## Configuration

```javascript
const preview = new Preview({
  // Required
  endpoint: 'https://your-endpoint.hygraph.com',

  // Optional
  studioUrl: 'https://app.hygraph.com',
  debug: true,
  mode: 'auto', // 'auto' | 'iframe' | 'standalone'

  // Overlay styling
  overlay: {
    style: {
      borderColor: '#3b82f6',
      borderWidth: '2px',
    },
    button: {
      backgroundColor: '#3b82f6',
      color: 'white',
    },
  },

  // Advanced
  sync: {
    fieldFocus: false,
    fieldUpdate: false,
  },
});
```

## Methods

```javascript
// Get SDK version
const version = preview.getVersion();

// Get current mode
const mode = preview.getMode(); // 'iframe' | 'standalone'

// Check if connected to Studio
const connected = preview.isConnected();

// Refresh element detection
preview.refresh();

// Update overlay styling
preview.configureOverlay({
  style: { borderColor: '#ff0000' }
});

// Clean up
preview.destroy();
```

## Dynamic Content

If you add content dynamically, call `refresh()`:

```javascript
// Add new content
document.body.innerHTML += `
  <article data-hygraph-entry-id="new-entry">
    <h1 data-hygraph-entry-id="new-entry" data-hygraph-field-api-id="title">
      New Title
    </h1>
  </article>
`;

// Tell SDK to detect new elements
preview.refresh();
```

## Complete Example

See the [complete vanilla HTML example](../../examples/vanilla-html-example/) with an Express server.
