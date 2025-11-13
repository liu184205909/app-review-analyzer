// Server-side polyfills for browser globals
if (typeof global !== 'undefined' && typeof globalThis !== 'undefined') {
  // Define self for server-side
  (global as any).self = globalThis;

  // Define other browser globals as undefined for server-side
  (global as any).window = undefined;
  (global as any).document = undefined;
  (global as any).navigator = undefined;
}

// Export to ensure this module is evaluated
export {};