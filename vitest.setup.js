// jsdom project setup: jest-dom matchers (toBeInTheDocument, etc.) and automatic
// React Testing Library cleanup between tests.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
