// Next.js plugin to define self globally

const { DefinePlugin } = require('webpack');

module.exports = function (nextConfig = {}) {
  return {
    ...nextConfig,
    webpack: (config, { isServer, webpack }) => {
      // Run the existing webpack config if it exists
      if (typeof nextConfig.webpack === 'function') {
        config = nextConfig.webpack(config, { isServer, webpack });
      }

      if (isServer) {
        // Add aggressive BannerPlugin to define self before any module loads
        config.plugins.unshift(
          new webpack.BannerPlugin({
            banner: `
              try {
                if (typeof global !== 'undefined') {
                  global.self = global;
                  global.window = undefined;
                  global.document = undefined;
                  global.navigator = undefined;
                }
                if (typeof globalThis !== 'undefined') {
                  globalThis.self = globalThis;
                }
              } catch (e) {
                // Fallback
                if (typeof global !== 'undefined') {
                  global.self = global;
                }
              }
            `,
            raw: true,
            entryOnly: false,
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER,
          })
        );

        // DefinePlugin for build-time replacement
        config.plugins.push(
          new DefinePlugin({
            'typeof self': '"object"',
            'self': 'globalThis',
          })
        );
      }

      return config;
    },
  };
};