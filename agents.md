# Hygraph Preview SDK – Agent Guide

## Purpose
- Equip AI agents to help developers add the Hygraph Preview SDK to new or existing projects.
- Give fast answers (quick reference) plus deep context (codebase layout, examples, troubleshooting).
- Default assumption: the developer wants clickable edit buttons in Hygraph previews with minimal setup.

## Quick Reference

### Integration Decision Path
- Next.js?
  - Using the App Router (`app/`)? → Use `HygraphPreview` with dynamic import and `router.refresh()` in the save handler.
  - Using the Pages Router (`pages/`)? → Load `HygraphPreview` client-side and refresh with `router.replace(router.asPath)` or an SWR/Query revalidation.
- Remix? → Wrap routes with `HygraphPreview`, use Remix revalidation (`revalidate()`, loader re-fetch) on save.
- Vue 3? → Register a wrapper component around the root app, refresh via router navigation or data refetch.
- Anything else (vanilla, custom framework)? → Instantiate `Preview` from `@hygraph/preview-sdk/core` and wire save events manually.

### Required vs Optional Configuration
- Required: `endpoint`, `data-hygraph-entry-id` on rendered nodes.
- Recommended: `onSave` callback that refreshes data, `debug={process.env.NODE_ENV === 'development'}`.
- Optional: `studioUrl`, overlay styling, sync options (`fieldFocus`, `fieldUpdate`), standalone mode overrides.

### Core Setup Checklist
- Install package: `npm install @hygraph/preview-sdk`.
- Wrap rendered tree in framework-specific preview wrapper.
- Mark rendered content with data attributes for entry/field/component chain.
- Configure preview URL in Hygraph Studio to point to the running preview app.
- Ensure environment variables (endpoint, Studio URL) are available to the client.

### Data Attribute Patterns
```75:88:README.md
<article data-hygraph-entry-id="entry-123">
  <h1
    data-hygraph-entry-id="entry-123"
    data-hygraph-field-api-id="title"
  >
    My Article Title
  </h1>
  <p
    data-hygraph-entry-id="entry-123"
    data-hygraph-field-api-id="content"
  >
    Article content here...
  </p>
</article>
```

#### Component fields
- Use `data-hygraph-component-chain` for modular components, repeatable lists, and unions.
- Value is a JSON string array of `{ fieldApiId, instanceId }` hops (outermost first).
- Prefer `createPreviewAttributes` and `createComponentChainLink` helpers from `@hygraph/preview-sdk/core` to generate the attributes safely.

### Save Handler Cheat Sheet
- Next.js App Router: `router.refresh()`.
```37:44:examples/nextjs-example/src/components/PreviewWrapper.tsx
return (
  <HygraphPreview
    endpoint={process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT!}
    studioUrl={process.env.NEXT_PUBLIC_HYGRAPH_STUDIO_URL}
    debug={true}
    onSave={() => {
      console.log('Content saved, refreshing...');
      router.refresh();
    }}
  >
    {children}
  </HygraphPreview>
);
```
- Next.js Pages Router: `router.replace(router.asPath)` or full reload.
```128:147:docs/frameworks/nextjs-pages-router.md
<HygraphPreview
  onSave={() => {
    router.replace(router.asPath);
  }}
/>
```
- Remix: trigger loader revalidation (see example `app/routes/_index.tsx`).
- Vue 3: call `router.replace(router.currentRoute.value.fullPath)` or refetch data sources.
- Vanilla: `window.location.reload()` or custom fetch/invalidate routine.

### SDK Modes
- Iframe (Studio) mode: preview loads inside `app.hygraph.com`, save events come via postMessage.
- Standalone mode: preview runs outside Studio, edit button opens Studio in new tab; configure via `standalone` options.

## Codebase Structure
- Entry points:
  - `src/index.ts` exports framework-agnostic `Preview` plus types.
  - `src/react/index.ts` exposes `HygraphPreview`, hooks, and React helpers.
  - `src/core/index.ts` re-exports low-level building blocks for non-React environments.
- Core modules:
  - `Preview.ts` orchestrates modes, overlays, messaging, field registry, save subscriptions.
  - `FieldRegistry.ts` collects DOM nodes annotated with `data-hygraph-*`.
  - `MessageBridge.ts` manages postMessage communication with Studio.
  - `ContentUpdater.ts` applies field updates for live sync.
  - `OverlayManager.ts` draws hover overlays and action buttons.
- React layer:
  - `HygraphPreview.tsx` wraps the core preview with lifecycle management, context, and event subscriptions.
  ```55:137:src/react/HygraphPreview.tsx
  useEffect(() => {
    const preview = new Preview({
      ...config,
      onFieldFocus,
      onFieldUpdate,
    });
    previewRef.current = preview;
    if (onSave) {
      unsubscribe = preview.subscribe('save', { callback: onSave });
    }
    ...
  }, [...]);
  ```
  - `usePreview.ts` exposes hooks for accessing the preview instance, refresh helpers, and diagnostics.
- Types: `src/types/index.ts` defines message contracts, config shapes, field update payloads, and overlay options.
- Build assets: `dist/` provides CJS/ESM bundles for main, `core`, and `react` entry points; ensure correct export path when debugging consumers.

## Integration Patterns
- Next.js App Router:
  - Use a client component wrapper with `next/dynamic` to avoid SSR issues.
  - Gate preview to development (or feature flag) to avoid production overhead.
  - Use `router.refresh()` to preserve scroll/state.
- Next.js Pages Router:
  - Lazy load `HygraphPreview` in `useEffect` (`typeof window !== 'undefined'` guard).
  - Refresh via `router.replace(router.asPath)` to keep scroll; optionally integrate SWR/React Query invalidations.
- Remix:
  - Use `clientOnly` wrapper or Remix `useHydrated` guards for client-only rendering.
  - On save, call Remix revalidation helpers or use `fetcher.submit` to re-run loaders.
- Vue 3:
  - Wrap root layout (`App.vue`) with `HygraphPreview` component from `@hygraph/preview-sdk/vue` (if present) or create a composable using `Preview`.
  - Use router navigation or store updates on save.
- Vanilla:
  - Instantiate `new Preview({ endpoint, onSave })`, subscribe to events, and destroy on teardown.
  - Ensure DOM nodes have `data-hygraph-*` attributes; consider MutationObserver for dynamic content.

## Common Tasks & Solutions
- Onboard existing project:
  - Identify framework and choose corresponding wrapper implementation.
  - Add environment variables via `.env.local` (examples provide templates).
  - Register preview URL in Hygraph Studio → Settings → Preview URLs.
  - Annotate template output with data attributes (entry ID, field API IDs, optional component chain).
- Troubleshooting missing edit buttons:
  - Confirm `endpoint` prop matches the project and stage.
  - Use `debug={true}` to surface console logs about missing attributes or blocked origins.
  - Verify preview runs on allowed origin (defaults to `app.hygraph.com` and `localhost:3000`; extend via `allowedOrigins`).
- Hydration or SSR errors:
  - Ensure wrapper only renders on client (dynamic import for Next.js App Router with `ssr: false`, `useEffect` guard for Pages Router).
  - Avoid running `new Preview()` during SSR.
- Live update expectations:
  - Field-sync (`sync.fieldUpdate`) is optional; default flow is save event followed by page reload/refresh.
  - For rich text, Hygraph sends multiple formats; align DOM with `data-hygraph-rich-text-format`.

## Framework-Specific Playbooks
- Next.js App Router:
  - Reference `examples/nextjs-example/src/components/PreviewWrapper.tsx` for idiomatic wrapper.
  - Mention dynamic import and `router.refresh()` usage.
- Next.js Pages Router:
  - Reference `examples/nextjs-pages-example/components/PreviewWrapper.tsx` and `_app.tsx`.
  - Highlight `router.replace(router.asPath)` and development-only loading.
- Remix:
  - Use `examples/remix-example/app/components/PreviewWrapper.client.tsx` for client-only wrapper, plus `PreviewWrapper.tsx` to bridge Remix loaders.
- Vue 3:
  - Study `examples/vue-example/src/components/PreviewWrapper.vue` for Composition API integration.
- Vanilla:
  - Inspect `examples/vanilla-html-example/js/preview-sdk.js` for direct core usage.

## Examples Directory Map
- `examples/README.md` describes schema bootstrapping, environment variables, and ports.
- Each framework folder includes:
  - `README.md` with setup steps.
  - Wrapper component under `components/PreviewWrapper.*`.
  - `lib/queries.ts` or equivalent showing GraphQL fetching.
  - `.env.example` (if missing, prompt developer to create from docs).
- `examples/schema.json` contains recipe schema used across demos; agents can point users to manual or Management API setup.

## Troubleshooting Guide
- No overlay buttons:
  - Ensure wrapper renders (check console for `HygraphPreview` initialization).
  - Confirm DOM has `data-hygraph-entry-id` attributes.
  - Check network tab for blocked postMessage or CORS warnings.
- Preview not refreshing:
  - Verify `onSave` callback executes (log inside).
  - For App Router, ensure the wrapper lives inside layout so `router.refresh()` is available.
  - For Pages Router, confirm `router.replace(router.asPath)` is reachable (avoid server-only contexts).
- Studio integration mismatch:
  - Validate preview URL includes protocol and matches running port.
  - If using custom Studio domain, set `studioUrl` prop.
- Debug workflow:
  - Set `debug={true}` to expose events in console.
  - Inspect `window.__HYGRAPH_PREVIEW__` when debug is enabled for manual control, mode check, and event listing.

## Interaction Tips for Agents
- Start by confirming framework, router type, and preview hosting environment.
- Provide smallest viable code snippet; link to example file for fuller context.
- Encourage developers to reuse example wrappers rather than reimplementing from scratch.
- Remind about enabling preview only in development unless a preview environment is intentionally exposed.
- When uncertain about project specifics (e.g., data fetching strategy), offer multiple refresh options and note trade-offs.

