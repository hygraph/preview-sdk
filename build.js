#!/usr/bin/env node

/**
 * Multi-entry build script for Hygraph Preview SDK
 */

import { build } from 'vite';
import { execSync } from 'child_process';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function buildAll() {
  console.log('🚀 Building Hygraph Preview SDK...\n');

  try {
    // Clean dist directory
    console.log('🧹 Cleaning dist directory...');
    rmSync('dist', { recursive: true, force: true });
    mkdirSync('dist', { recursive: true });
    mkdirSync('dist/core', { recursive: true });
    mkdirSync('dist/react', { recursive: true });

    // Build main entry with the existing vite config
    console.log('📦 Building main entry (ESM, CJS, UMD)...');
    execSync('npx vite build', { stdio: 'inherit' });

    console.log('📦 Building core entry...');
    // Build core entry - ESM and CJS only
    await build({
      build: {
        lib: {
          entry: resolve(__dirname, 'src/core/index.ts'),
          name: 'HygraphPreviewCore',
          formats: ['es', 'cjs'],
          fileName: (format) => format === 'es' ? 'index.esm.js' : 'index.cjs.js',
        },
        outDir: 'dist/core',
        rollupOptions: {
          external: ['react', 'react-dom'],
          output: {
            exports: 'named',
          },
        },
        sourcemap: true,
        minify: 'terser',
        emptyOutDir: false,
      },
    });

    console.log('📦 Building React entry...');
    // Build React entry - ESM and CJS only
    // Note: We generate types manually below, so we don't use vite-plugin-dts here
    await build({
      build: {
        lib: {
          entry: resolve(__dirname, 'src/react/index.ts'),
          name: 'HygraphPreviewReact',
          formats: ['es', 'cjs'],
          fileName: (format) => format === 'es' ? 'index.esm.js' : 'index.cjs.js',
        },
        outDir: 'dist/react',
        rollupOptions: {
          external: (id) => {
            // Externalize React and its JSX runtime
            return id === 'react' || 
                   id === 'react-dom' || 
                   id === 'react/jsx-runtime' || 
                   id === 'react/jsx-dev-runtime' ||
                   id.startsWith('react/');
          },
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
              'react/jsx-runtime': 'React',
              'react/jsx-dev-runtime': 'React',
            },
            exports: 'named',
          },
        },
        sourcemap: true,
        minify: 'terser',
        emptyOutDir: false,
      },
    });

    // Generate type definitions
    console.log('📦 Creating TypeScript declarations...');
    
    // Core types - re-export from main index
    writeFileSync('dist/core/index.d.ts', `export * from '../index';
`);

    // React types - manually maintained to match src/react/index.ts exports
    // IMPORTANT: If you change exports in src/react/index.ts, update these types!
    console.log('📦 Generating React type definitions...');
    const reactDtsPath = resolve(__dirname, 'dist/react/index.d.ts');
    
    // Read source to validate exports match
    const reactIndexSource = readFileSync(resolve(__dirname, 'src/react/index.ts'), 'utf-8');
    const expectedExports = [
      'HygraphPreview',
      'HygraphPreviewNextjs',
      'usePreview',
      'usePreviewSave',
      'usePreviewEvent',
      'usePreviewRefresh',
      'usePreviewRemix',
      'usePreviewFieldUpdates',
      'usePreviewConnection',
      'usePreviewActions',
      'usePreviewDebug',
      'Preview',
    ];
    
    // Check that all expected exports are in the source
    const missingExports = expectedExports.filter(exp => !reactIndexSource.includes(exp));
    if (missingExports.length > 0) {
      console.error(`❌ Missing exports in src/react/index.ts: ${missingExports.join(', ')}`);
      process.exit(1);
    }
    
    // Create type definitions that match the source exports
    const reactTypeDefs = `// Auto-generated - manually maintained to match src/react/index.ts
// IMPORTANT: If you change exports in src/react/index.ts, update these types!
// Run the build to validate that all exports are present.

export * from '../index';

// Re-export types from main index
export type {
  PreviewConfig,
  FieldUpdate,
  SaveCallback,
  SubscriptionConfig,
  StudioMessage,
  SDKMessage,
  FieldType,
  PreviewEvents,
} from '../index';

// Re-export Preview class
export type { Preview } from '../index';

// React-specific component and hook exports
// These types must match the actual exports in src/react/index.ts
import type { PreviewConfig, SaveCallback, FieldUpdate, PreviewEvents, Preview } from '../index';
import type React from 'react';

export interface HygraphPreviewProps extends PreviewConfig {
  children: React.ReactNode;
  onReady?: (preview: Preview) => void;
  onConnected?: (studioOrigin: string) => void;
  onDisconnected?: () => void;
  onSave?: SaveCallback;
  onError?: (error: Error) => void;
  onFieldFocus?: (fieldApiId: string, locale?: string) => void;
  onFieldUpdate?: (update: FieldUpdate) => void;
}

export interface HygraphPreviewNextjsProps extends Omit<HygraphPreviewProps, 'onSave'> {
  refresh: () => void | Promise<void>;
  onSave?: SaveCallback;
}

export declare const HygraphPreview: React.FC<HygraphPreviewProps>;
export declare const HygraphPreviewNextjs: React.FC<HygraphPreviewNextjsProps>;

export declare function usePreview(): { preview: Preview | null; isReady: boolean; isConnected: boolean };
export declare function usePreviewSave(callback: SaveCallback): void;
export declare function usePreviewEvent<K extends keyof PreviewEvents>(
  eventType: K,
  handler: (event: PreviewEvents[K]) => void
): void;
export declare function usePreviewRefresh(): { refresh: () => void | Promise<void>; framework: string | null };
export declare function usePreviewRemix(): void;
export declare function usePreviewFieldUpdates(onUpdate?: (update: FieldUpdate) => void, onError?: (error: Error) => void): void;
export declare function usePreviewConnection(): { isConnected: boolean; isReady: boolean; mode: 'iframe' | 'standalone' | null };
export declare function usePreviewActions(): { refresh: () => void; destroy: () => void; getVersion: () => string | null };
export declare function usePreviewDebug(): { preview: Preview | null; mode: 'iframe' | 'standalone' | null; events: string[] };
`;
    
    writeFileSync(reactDtsPath, reactTypeDefs);
    
    // Validate that all expected exports are declared in the type definitions
    const typeDefsContent = reactTypeDefs;
    
    // React-specific exports that must be explicitly declared (not in main index)
    const reactSpecificExports = [
      'HygraphPreview',
      'HygraphPreviewNextjs',
      'usePreview',
      'usePreviewSave',
      'usePreviewEvent',
      'usePreviewRefresh',
      'usePreviewRemix',
      'usePreviewFieldUpdates',
      'usePreviewConnection',
      'usePreviewActions',
      'usePreviewDebug',
    ];
    
    // Check that React-specific exports are explicitly declared
    const missingTypeExports = reactSpecificExports.filter(exp => {
      // Check if export is explicitly declared (not just via export *)
      const patterns = [
        `export declare const ${exp}`,
        `export declare function ${exp}`,
        `export interface ${exp}`,
        `export type { ${exp}`,
        `export const ${exp}`,
        `export function ${exp}`,
      ];
      
      return !patterns.some(pattern => typeDefsContent.includes(pattern));
    });
    
    // Preview is re-exported from main index, so it's fine if it's via export *
    // But we check it's at least mentioned
    if (!typeDefsContent.includes('Preview') && !typeDefsContent.includes('export type { Preview }')) {
      missingTypeExports.push('Preview');
    }
    
    if (missingTypeExports.length > 0) {
      console.error(`❌ Missing type declarations for: ${missingTypeExports.join(', ')}`);
      console.error('   Please update dist/react/index.d.ts to include all exports from src/react/index.ts');
      process.exit(1);
    }
    
    console.log('   ✓ React type definitions validated');

    console.log('\n✅ Build completed successfully!');
    console.log('\n📁 Output files:');
    console.log('  dist/index.esm.js       - Main ESM bundle');
    console.log('  dist/index.cjs.js       - Main CommonJS bundle');
    console.log('  dist/index.umd.js       - Main UMD bundle');
    console.log('  dist/index.d.ts         - Main TypeScript definitions');
    console.log('  dist/core/index.esm.js  - Core ESM bundle');
    console.log('  dist/core/index.cjs.js  - Core CommonJS bundle');
    console.log('  dist/core/index.d.ts    - Core TypeScript definitions');
    console.log('  dist/react/index.esm.js - React ESM bundle');
    console.log('  dist/react/index.cjs.js - React CommonJS bundle');
    console.log('  dist/react/index.d.ts   - React TypeScript definitions');

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildAll();