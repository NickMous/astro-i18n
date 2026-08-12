import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.test.ts'],
        typecheck: {
            // Type tests live in *.test-d.ts and are analysed by tsc, never executed.
            // Run them together with the runtime suite via `vitest --typecheck`.
            include: ['test/**/*.test-d.ts'],
            tsconfig: './tsconfig.json',
        },
    },
});
