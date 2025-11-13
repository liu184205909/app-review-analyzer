// Node.js environment shims for browser APIs
// This file runs early in the server lifecycle to define missing globals

// Define self for Node.js environment
if (typeof globalThis !== 'undefined') {
  (globalThis as any).self = globalThis;
}

if (typeof global !== 'undefined') {
  (global as any).self = global;
  (global as any).window = undefined;
  (global as any).document = undefined;
  (global as any).navigator = undefined;
}

// Export nothing - this module is only for side effects
export {};