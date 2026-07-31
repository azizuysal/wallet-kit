const path = require('path');
const { configureProjects } = require('react-native-test-app');
const pkg = require('../package.json');

module.exports = {
  project: configureProjects({
    android: { sourceDir: 'android' },
    ios: { sourceDir: 'ios' },
  }),
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '..'),
      platforms: {
        ios: {},
        android: {},
      },
    },
  },
};
