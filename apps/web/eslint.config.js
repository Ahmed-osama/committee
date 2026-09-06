import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const restrictedLibImports = ['next/headers', 'next/cookies', 'next/navigation'];

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    // src/lib is domain logic (see src/lib/README.md) and must stay
    // decoupled from any single request/render context.
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: restrictedLibImports }],
    },
  },
];

export default eslintConfig;
