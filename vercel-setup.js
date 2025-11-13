// Vercel-specific setup to define global self before Next.js loads
console.log('Setting up global environment for Vercel deployment...');

// Define self globally at the earliest possible moment
if (typeof global !== 'undefined') {
  global.self = global;
  console.log('Global self defined:', typeof global.self);
}

if (typeof globalThis !== 'undefined') {
  globalThis.self = globalThis;
  console.log('GlobalThis self defined:', typeof globalThis.self);
}

// Export a function to ensure this runs
module.exports = function setupGlobals() {
  console.log('Globals setup completed');
};