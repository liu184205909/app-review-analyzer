// Server-side polyfills for browser globals
// This runs at the very beginning of the application lifecycle

// Ensure self is defined in Node.js environment
if (typeof global !== 'undefined') {
  if (!global.self) {
    global.self = global;
  }
}

if (typeof globalThis !== 'undefined') {
  if (!globalThis.self) {
    globalThis.self = globalThis;
  }
}

// Define other browser globals as undefined for server-side
if (typeof global !== 'undefined') {
  if (!global.window) global.window = undefined;
  if (!global.document) global.document = undefined;
  if (!global.navigator) global.navigator = undefined;
}

// Also define at module level for immediate availability
if (typeof module !== 'undefined' && module.exports) {
  (module.exports as any).self = (global as any).self || global;
}

// Export to ensure this module is evaluated
export {};