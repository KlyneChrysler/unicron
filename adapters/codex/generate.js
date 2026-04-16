import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const MARKER_START = '<!-- unicron-start -->';
const MARKER_END = '<!-- unicron-end -->';

function injectIntoFile(filePath, injection) {
  let existing = '';
  if (existsSync(filePath)) {
    existing = readFileSync(filePath, 'utf8');
  }

  const block = `${MARKER_START}\n${injection}\n${MARKER_END}`;

  if (existing.includes(MARKER_START)) {
    const startIdx = existing.indexOf(MARKER_START);
    const endIdx = existing.indexOf(MARKER_END) + MARKER_END.length;
    existing = existing.slice(0, startIdx) + block + existing.slice(endIdx);
  } else {
    existing = existing + (existing.endsWith('\n') ? '' : '\n') + '\n' + block + '\n';
  }

  writeFileSync(filePath, existing);
}

export async function generate(unicronRoot, baseDir) {
  const injection = readFileSync(
    join(unicronRoot, 'adapters', 'codex', 'templates', 'agents-injection.md'),
    'utf8'
  );

  const targetPath = join(baseDir, 'AGENTS.md');
  injectIntoFile(targetPath, injection);
  console.log(`  Injected unicron context into ${targetPath}`);
}
