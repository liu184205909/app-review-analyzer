// Vercel pre-build script to set up globals before Next.js
console.log('Setting up globals for Vercel deployment...');

// Define self globally at the earliest possible moment
if (typeof global !== 'undefined') {
  if (!global.self) {
    global.self = global;
  }
  if (!global.window) {
    global.window = undefined;
  }
  if (!global.document) {
    global.document = undefined;
  }
  if (!global.navigator) {
    global.navigator = undefined;
  }
}

if (typeof globalThis !== 'undefined') {
  if (!globalThis.self) {
    globalThis.self = globalThis;
  }
}

// Override Node.js require to inject self into modules
const originalRequire = require;
require = function(id) {
  const module = originalRequire(id);

  // After module is loaded, ensure self is defined
  if (typeof global !== 'undefined' && !global.self) {
    global.self = global;
  }

  return module;
};

console.log('Globals setup completed:', {
  hasGlobalSelf: typeof global?.self,
  hasGlobalThisSelf: typeof globalThis?.self
});