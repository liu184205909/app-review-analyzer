#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Bundle analysis script
console.log('🔍 Analyzing bundle size and performance...\n');

// Function to get directory size
function getDirectorySize(dirPath) {
  let totalSize = 0;

  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  }

  return totalSize;
}

// Function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Analyze Next.js build output
function analyzeBuild() {
  console.log('📦 Build Output Analysis:');

  const buildPath = path.join(process.cwd(), '.next');

  if (!fs.existsSync(buildPath)) {
    console.log('❌ Build output not found. Run `npm run build` first.');
    return;
  }

  // Static files
  const staticPath = path.join(buildPath, 'static');
  const staticSize = getDirectorySize(staticPath);
  console.log(`   Static files: ${formatBytes(staticSize)}`);

  // Chunks
  const chunksPath = path.join(buildPath, 'static', 'chunks');
  if (fs.existsSync(chunksPath)) {
    const chunkFiles = fs.readdirSync(chunksPath).filter(f => f.endsWith('.js'));
    const chunksTotal = chunkFiles.reduce((total, file) => {
      return total + fs.statSync(path.join(chunksPath, file)).size;
    }, 0);
    console.log(`   JS chunks (${chunkFiles.length} files): ${formatBytes(chunksTotal)}`);

    // Show largest chunks
    const chunkSizes = chunkFiles.map(file => ({
      file,
      size: fs.statSync(path.join(chunksPath, file)).size
    })).sort((a, b) => b.size - a.size);

    console.log('   Largest chunks:');
    chunkSizes.slice(0, 5).forEach(chunk => {
      console.log(`     - ${chunk.file}: ${formatBytes(chunk.size)}`);
    });
  }

  // Server files
  const serverPath = path.join(buildPath, 'server');
  if (fs.existsSync(serverPath)) {
    const serverSize = getDirectorySize(serverPath);
    console.log(`   Server files: ${formatBytes(serverSize)}`);
  }

  console.log();
}

// Analyze dependencies
function analyzeDependencies() {
  console.log('📚 Dependencies Analysis:');

  try {
    const packageJson = require(path.join(process.cwd(), 'package.json'));
    const dependencies = Object.entries(packageJson.dependencies || {});
    const devDependencies = Object.entries(packageJson.devDependencies || {});

    console.log(`   Production dependencies: ${dependencies.length}`);
    console.log(`   Development dependencies: ${devDependencies.length}`);

    // Find largest dependencies
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      const depSizes = [];

      dependencies.forEach(([name]) => {
        const depPath = path.join(nodeModulesPath, name);
        if (fs.existsSync(depPath)) {
          const size = getDirectorySize(depPath);
          depSizes.push({ name, size });
        }
      });

      depSizes.sort((a, b) => b.size - a.size);

      console.log('   Largest production dependencies:');
      depSizes.slice(0, 10).forEach(dep => {
        console.log(`     - ${dep.name}: ${formatBytes(dep.size)}`);
      });
    }

  } catch (error) {
    console.log('   ❌ Could not analyze dependencies');
  }

  console.log();
}

// Analyze images
function analyzeImages() {
  console.log('🖼️  Images Analysis:');

  const publicPath = path.join(process.cwd(), 'public');
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
  let totalImages = 0;
  let totalSize = 0;
  const imageSizes = [];

  function scanDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory() && !file.startsWith('.')) {
        scanDirectory(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (imageExtensions.includes(ext)) {
          totalImages++;
          totalSize += stats.size;
          imageSizes.push({ file: path.relative(publicPath, filePath), size: stats.size });
        }
      }
    }
  }

  if (fs.existsSync(publicPath)) {
    scanDirectory(publicPath);

    console.log(`   Total images: ${totalImages}`);
    console.log(`   Total size: ${formatBytes(totalSize)}`);

    if (imageSizes.length > 0) {
      const avgSize = totalSize / imageSizes.length;
      console.log(`   Average size: ${formatBytes(avgSize)}`);

      imageSizes.sort((a, b) => b.size - a.size);
      console.log('   Largest images:');
      imageSizes.slice(0, 5).forEach(img => {
        console.log(`     - ${img.file}: ${formatBytes(img.size)}`);
      });
    }
  } else {
    console.log('   No public directory found');
  }

  console.log();
}

// Performance recommendations
function showRecommendations() {
  console.log('💡 Performance Recommendations:');

  const recommendations = [
    'Use Next.js Image component for automatic optimization',
    'Implement code splitting for large components',
    'Add loading states and skeleton screens',
    'Optimize API responses with caching',
    'Use WebP format for images with fallbacks',
    'Minimize bundle size with tree shaking',
    'Implement Service Worker for caching',
    'Use React.memo for expensive components',
    'Debounce search and filter operations',
    'Virtualize long lists'
  ];

  recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });

  console.log();
}

// Generate performance report
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    build: {},
    dependencies: {},
    images: {},
    recommendations: []
  };

  const reportPath = path.join(process.cwd(), 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('📄 Performance report generated: performance-report.json');
  console.log();
}

// Main execution
try {
  analyzeBuild();
  analyzeDependencies();
  analyzeImages();
  showRecommendations();
  generateReport();

  console.log('✅ Performance analysis completed!');
  console.log('\n🚀 Next steps:');
  console.log('   1. Run `npm run build` to create optimized production build');
  console.log('   2. Use `npm run start` to test production performance');
  console.log('   3. Monitor performance in browser DevTools');
  console.log('   4. Set up Lighthouse CI for automated testing');

} catch (error) {
  console.error('❌ Error during analysis:', error.message);
  process.exit(1);
}