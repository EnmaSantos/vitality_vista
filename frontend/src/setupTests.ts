// This file is referenced in vite.config.ts's test.setupFiles
// It's a good place for global test setup

// To extend Vitest's expect with jest-dom matchers
import '@testing-library/jest-dom';

// You can also put other global setup here, for example:
// import { expect } from 'vitest';
// import * as matchers from '@testing-library/jest-dom/matchers';
// expect.extend(matchers);
// However, the side-effect import above is usually sufficient for jest-dom.
