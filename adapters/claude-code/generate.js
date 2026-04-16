import { existsSync, readFileSync, writeFileSync, mkdirSync, cpSync } from 'fs';
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

export async function generate(unicronRoot, homeDir) {
  const claudeDir = join(homeDir, '.claude');
  const skillsTarget = join(claudeDir, 'skills', 'unicron');
  const agentsTarget = join(claudeDir, 'agents');

  mkdirSync(skillsTarget, { recursive: true });
  cpSync(join(unicronRoot, 'skills'), skillsTarget, { recursive: true });
  console.log(`  Copied skills to ${skillsTarget}`);

  mkdirSync(agentsTarget, { recursive: true });
  cpSync(join(unicronRoot, 'agents'), agentsTarget, { recursive: true });
  console.log(`  Copied agents to ${agentsTarget}`);

  const injection = readFileSync(
    join(unicronRoot, 'adapters', 'claude-code', 'templates', 'claude-md-injection.md'),
    'utf8'
  );

  const claudeMdPath = join(claudeDir, 'CLAUDE.md');
  injectIntoFile(claudeMdPath, injection);
  console.log(`  Injected unicron context into ${claudeMdPath}`);
}
