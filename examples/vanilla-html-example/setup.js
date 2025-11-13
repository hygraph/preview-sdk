#!/usr/bin/env node

import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setup() {
  try {
    // Create js directory if it doesn't exist
    const jsDir = join(__dirname, 'js');
    await fs.mkdir(jsDir, { recursive: true });

    // Copy the UMD bundle from node_modules
    const srcPath = join(__dirname, 'node_modules', '@hygraph', 'preview-sdk', 'dist', 'index.umd.js');
    const destPath = join(jsDir, 'preview-sdk.js');

    await fs.copyFile(srcPath, destPath);
    console.log('✅ Live Preview UMD bundle copied from @hygraph/preview-sdk to js/preview-sdk.js');
  } catch (error) {
    console.error('❌ Error setting up vanilla HTML example:', error.message);
    console.error('💡 Make sure to run "npm install" first to install @hygraph/preview-sdk');
    process.exit(1);
  }
}

setup();