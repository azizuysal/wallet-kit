import globals from 'globals';
import reactNativeFlatConfig from '@react-native/eslint-config/flat';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    ignores: ['node_modules/**', 'lib/**', 'coverage/**', 'docs/**'],
  },
  ...reactNativeFlatConfig,
  prettierRecommended,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': [
        'error',
        {
          quoteProps: 'consistent',
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
          useTabs: false,
        },
      ],
    },
  },
  {
    files: [
      'scripts/**/*.{js,cjs,mjs}',
      '*.config.{js,cjs,mjs}',
      'jest.setup.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
