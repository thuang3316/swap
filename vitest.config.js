import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Two projects so each test runs in the right environment:
//  - node:  backend + shared pure logic (*.test.js)
//  - jsdom: React component/behavior tests (*.test.jsx), with the react plugin
//           for JSX + a setup file for jest-dom matchers and RTL cleanup.
// `globals: true` exposes describe/it/expect/vi (declared in the eslint test
// block). The API integration project is added when that layer lands.
// See guides/testing.md.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          globals: true,
          environment: 'node',
          include: ['server/**/*.test.js', 'src/lib/**/*.test.js', 'tests/**/*.test.js'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'jsdom',
          globals: true,
          environment: 'jsdom',
          include: ['src/**/*.test.jsx'],
          setupFiles: ['./vitest.setup.js'],
        },
      },
    ],
  },
});
