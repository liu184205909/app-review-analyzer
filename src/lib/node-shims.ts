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
    // Define self property
    if (!(global as any).self) {
      Object.defineProperty(global, 'self', {
        value: global,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }

    // Define other browser globals as undefined for server-side
    // Use try-catch for each property as some may be read-only
    try {
      if (typeof (global as any).window === 'undefined') {
        (global as any).window = undefined;
      }
    } catch (e) {
      // Property is read-only, skip
    }
    
    try {
      if (typeof (global as any).document === 'undefined') {
        (global as any).document = undefined;
      }
    } catch (e) {
      // Property is read-only, skip
    }
    
    try {
      if (typeof (global as any).navigator === 'undefined') {
        (global as any).navigator = undefined;
      }
    } catch (e) {
      // Property is read-only, skip
    }
  }
} catch (e) {
  // Fallback if defineProperty fails
  if (typeof global !== 'undefined') {
    try {
      (global as any).self = global;
    } catch (e) {
      // Skip if can't set
    }
  }
}

// Export nothing - this module is only for side effects
export {};