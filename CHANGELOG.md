# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-11-13

### Added
- Initial stable release of Hygraph Preview SDK
- React component (`HygraphPreview`) with framework-native refresh support
- Core JavaScript SDK (`Preview`) for vanilla JavaScript and custom frameworks
- Support for Next.js (App Router & Pages Router), Remix, Vue 3, and vanilla JavaScript
- Data attribute system for marking editable content (`data-hygraph-entry-id`, `data-hygraph-field-api-id`)
- Component chain support for nested and repeatable components
- Edit button overlays for intuitive content navigation
- Field focus synchronization with Hygraph Studio
- Real-time field updates (optional)
- Event system for save callbacks and content updates
- TypeScript support with full type definitions
- Multiple bundle formats (ESM, CommonJS, UMD)
- Helper functions: `createPreviewAttributes`, `createComponentChainLink`, `withFieldPath`
- Comprehensive documentation and examples for all supported frameworks

### Features
- Zero-flicker content updates using framework-specific refresh mechanisms
- Automatic element detection via MutationObserver
- Dual mode operation (iframe and standalone)
- Configurable overlay styling and positioning
- Rich text format preferences (HTML, Markdown, Text)
- Debug mode for development
- Customizable allowed origins for security

[Unreleased]: https://github.com/hygraph/preview-sdk/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/hygraph/preview-sdk/releases/tag/v1.0.0
