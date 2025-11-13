// Server-side polyfills for browser globals
// This runs at the very beginning of the application lifecycle

// Ensure self is defined in Node.js environment
if (typeof global !== 'undefined') {
  if (!(global as any).self) {
    (global as any).self = global;
  }
}

if (typeof globalThis !== 'undefined') {
  if (!(globalThis as any).self) {
    (globalThis as any).self = globalThis;
  }
}

// Define other browser globals as undefined for server-side
if (typeof global !== 'undefined') {
  if (!(global as any).window) (global as any).window = undefined;
  if (!(global as any).document) (global as any).document = undefined;
  if (!(global as any).navigator) (global as any).navigator = undefined;
}

// Also define at module level for immediate availability
if (typeof module !== 'undefined' && module.exports) {
  (module.exports as any).self = (global as any).self || global;
}

// Export to ensure this module is evaluated
export {};