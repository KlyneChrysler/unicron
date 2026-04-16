import { detectPlatforms, PLATFORMS, writeConfig } from './installer.js';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function makeTempDir() {
	return mkdtempSync(join(tmpdir(), 'unicron-test-'));
}

describe('detectPlatforms', () => {
	test('detects Claude Code when ~/.claude/ exists', () => {
		const home = makeTempDir();
		mkdirSync(join(home, '.claude'));
		expect(detectPlatforms(home)).toContain(PLATFORMS.CLAUDE_CODE);
	});

	test('detects Gemini when ~/.gemini/ exists', () => {
		const home = makeTempDir();
		mkdirSync(join(home, '.gemini'));
		expect(detectPlatforms(home)).toContain(PLATFORMS.GEMINI);
	});

	test('detects Copilot when .github/copilot-instructions.md exists', () => {
		const home = makeTempDir();
		mkdirSync(join(home, '.github'));
		writeFileSync(join(home, '.github', 'copilot-instructions.md'), '');
		expect(detectPlatforms(home)).toContain(PLATFORMS.COPILOT);
	});

	test('detects Codex when AGENTS.md exists', () => {
		const home = makeTempDir();
		writeFileSync(join(home, 'AGENTS.md'), '');
		expect(detectPlatforms(home)).toContain(PLATFORMS.CODEX);
	});

	test('detects multiple platforms simultaneously', () => {
		const home = makeTempDir();
		mkdirSync(join(home, '.claude'));
		mkdirSync(join(home, '.gemini'));
		const platforms = detectPlatforms(home);
		expect(platforms).toContain(PLATFORMS.CLAUDE_CODE);
		expect(platforms).toContain(PLATFORMS.GEMINI);
	});

	test('returns empty array when no platforms detected', () => {
		expect(detectPlatforms(makeTempDir())).toHaveLength(0);
	});
});

describe('writeConfig', () => {
	test('writes .unicron/config.yaml with detected platforms', () => {
		const home = makeTempDir();
		writeConfig(['claude-code', 'gemini'], home);
		const config = readFileSync(join(home, '.unicron', 'config.yaml'), 'utf8');
		expect(config).toContain('claude-code');
		expect(config).toContain('gemini');
		expect(config).toContain('status: not-started');
	});
});
