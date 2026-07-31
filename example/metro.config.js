const fs = require('node:fs');
const path = require('node:path');
const {
  defaultWatchFolders,
  makeMetroConfig,
} = require('@rnx-kit/metro-config');

const walletKitRoot = fs.realpathSync(
  path.join(__dirname, 'node_modules/@azizuysal/wallet-kit')
);

module.exports = makeMetroConfig({
  watchFolders: [...defaultWatchFolders(), walletKitRoot],
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
});
