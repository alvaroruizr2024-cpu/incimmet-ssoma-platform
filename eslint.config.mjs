import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  prettier,
  // Campo deliberately reloads the document to isolate its offline app shell.
  {
    files: ['components/shell/app-shell.tsx', 'components/marketing/context-link.tsx'],
    rules: { '@next/next/no-location-assign-relative-destination': 'off' },
  },
  // React Compiler is not enabled; TanStack Table manages its own reactive state.
  {
    files: ['components/screens/eventos.tsx'],
    rules: { 'react-hooks/incompatible-library': 'off' },
  },
  { files: ['scripts/**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  globalIgnores(['.next/**', 'out/**', '.verification/**', 'coverage/**', 'next-env.d.ts']),
]);
