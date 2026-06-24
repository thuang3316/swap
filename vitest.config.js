import { defineConfig } from 'vitest/config';

// Test runner config. `globals: true` exposes describe/it/expect/vi without
// imports (the eslint test block in eslint.config.js declares them). The unit +
// API layers run in Node; frontend component tests (added later) will run in a
// jsdom project. See guides/testing.md.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Unit/logic + (later) API integration. Frontend .test.jsx files get their
    // own jsdom project when that layer lands.
    include: ['server/**/*.test.js', 'src/lib/**/*.test.js', 'tests/**/*.test.js'],
  },
});
