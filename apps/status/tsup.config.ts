import { defineConfig } from 'tsup';

// One bundled file, so the Docker image needs no node_modules at runtime.
export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	platform: 'node',
	target: 'node22',
	clean: true,
	sourcemap: true,
	noExternal: [/.*/]
});
