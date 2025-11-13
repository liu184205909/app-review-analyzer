// Global self fix - this runs before any other module

// Define self at the global level immediately
globalThis.self = globalThis;
global.self = global;

// Also define using a more aggressive approach
if (typeof Object.defineProperty === 'function') {
  try {
    Object.defineProperty(globalThis, 'self', {
      value: globalThis,
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (e) {
    // Fallback
    globalThis.self = globalThis;
  }
}

console.log('Global self defined via global-self-fix.js:', typeof global?.self, typeof globalThis?.self);

// Export nothing - this module is only for side effects
export {};