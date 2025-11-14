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
// Wrap in try-catch as some properties may be read-only
if (typeof global !== 'undefined') {
  try {
    if (!(global as any).window) (global as any).window = undefined;
  } catch (e) {
    // Property is read-only, skip
  }
  try {
    if (!(global as any).document) (global as any).document = undefined;
  } catch (e) {
    // Property is read-only, skip
  }
  try {
    if (!(global as any).navigator) (global as any).navigator = undefined;
  } catch (e) {
    // Property is read-only, skip
  }
}

// Also define at module level for immediate availability
if (typeof module !== 'undefined' && module.exports) {
  (module.exports as any).self = (global as any).self || global;
}

// Export to ensure this module is evaluated
export {};