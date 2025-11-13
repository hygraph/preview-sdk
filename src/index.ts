/**
 * Main entry point for the Hygraph Preview SDK
 * This exports core SDK functionality (framework-agnostic)
 */

// Core exports (framework-agnostic)
export { Preview } from './core/Preview';
export * from './core';
export * from './types';

// Default export for convenience
export { Preview as default } from './core/Preview';