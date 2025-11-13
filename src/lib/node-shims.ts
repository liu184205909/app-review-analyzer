// Node.js environment shims for browser APIs
// This file runs early in the server lifecycle to define missing globals

// Aggressive self definition for Node.js environment
try {
  if (typeof globalThis !== 'undefined') {
    Object.defineProperty(globalThis, 'self', {
      value: globalThis,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
} catch (e) {
  // Fallback if defineProperty fails
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).self = globalThis;
  }
}

try {
  if (typeof global !== 'undefined') {
    Object.defineProperty(global, 'self', {
      value: global,
      writable: true,
      configurable: true,
      enumerable: true
    });

    // Define other browser globals as undefined for server-side
    (global as any).window = undefined;
    (global as any).document = undefined;
    (global as any).navigator = undefined;
  }
} catch (e) {
  // Fallback if defineProperty fails
  if (typeof global !== 'undefined') {
    (global as any).self = global;
    (global as any).window = undefined;
    (global as any).document = undefined;
    (global as any).navigator = undefined;
  }
}

// Export nothing - this module is only for side effects
export {};