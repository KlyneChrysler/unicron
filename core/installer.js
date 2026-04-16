#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

export const PLATFORMS = {
	CLAUDE_CODE: 'claude-code',
	GEMINI: 'gemini',
	COPILOT: 'copilot',
	CODEX: 'codex',
};

export function detectPlatforms(baseDir = homedir()) {
	const detected = [];
	if (existsSync(join(baseDir, '.claude'))) detected.push(PLATFORMS.CLAUDE_CODE);
	if (existsSync(join(baseDir, '.gemini'))) detected.push(PLATFORMS.GEMINI);
	if (existsSync(join(baseDir, '.github', 'copilot-instructions.md'))) detected.push(PLATFORMS.COPILOT);
	if (existsSync(join(baseDir, 'AGENTS.md'))) detected.push(PLATFORMS.CODEX);
	return detected;
}

export function writeConfig(platforms, baseDir) {
	const configDir = join(baseDir, '.unicron');
	mkdirSync(configDir, { recursive: true });
	const lines = [
		`version: "1.0.0"`,
		`installed_platforms:`,
		...platforms.map(p => `  - ${p}`),
		`project:`,
		`  spec: docs/unicron/spec.md`,
		`  plan: docs/unicron/plan.md`,
		`  current_phase: 0`,
		`  status: not-started`,
	];
	writeFileSync(join(configDir, 'config.yaml'), lines.join('\n') + '\n');
}

async function runAdapter(platform, baseDir) {
	const adapterPath = join(ROOT, 'adapters', platform, 'generate.js');
	if (!existsSync(adapterPath)) {
		console.warn(`  Warning: No adapter found for ${platform}`);
		return;
	}
	const { generate } = await import(adapterPath);
	await generate(ROOT, baseDir);
}

const homeArgIndex = process.argv.indexOf('--home');
const homeOverride = homeArgIndex !== -1 ? process.argv[homeArgIndex + 1] : null;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const targetHome = homeOverride ?? homedir();
	const platforms = detectPlatforms(targetHome);

	if (platforms.length === 0) {
		console.log('No supported AI platforms detected.');
		console.log('Supported: Claude Code (~/.claude/), Gemini (~/.gemini/), Copilot (.github/copilot-instructions.md), Codex (AGENTS.md)');
		process.exit(1);
	}

	console.log(`Detected platforms: ${platforms.join(', ')}`);
	for (const platform of platforms) {
		console.log(`\nInstalling ${platform} adapter...`);
		await runAdapter(platform, targetHome);
		console.log(`  ${platform} done.`);
	}

	writeConfig(platforms, targetHome);
	console.log('\nUnicron installed. Run /unicron to get started.');
}
