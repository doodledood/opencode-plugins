#!/usr/bin/env python3
"""Transform copied Claude Code plugin files to OpenCode format."""

import re
import glob
import sys

# Model mappings - update these when new models release
MODEL_MAP = {
    'opus': 'anthropic/claude-opus-4-5-20251101',
    'sonnet': 'anthropic/claude-sonnet-4-5-20250929',
    'haiku': 'anthropic/claude-haiku-4-5-20251001',
}

# Tool permission mappings
TOOL_MAP = {
    'Bash': 'bash', 'BashOutput': 'bash',
    'Read': 'read',
    'Edit': 'edit', 'Write': 'edit',
    'WebFetch': 'webfetch', 'WebSearch': 'websearch',
    'Task': 'task', 'Skill': 'skill', 'NotebookEdit': 'notebook'
}


def transform_frontmatter(content: str, file_type: str) -> str:
    """Transform YAML frontmatter based on file type."""
    parts = content.split('---', 2)
    if len(parts) < 3:
        return content

    frontmatter, body = parts[1], parts[2]

    # Remove name: line
    frontmatter = re.sub(r'^name: [^\n]+\n', '', frontmatter, flags=re.MULTILINE)
    # Remove user-invocable: line
    frontmatter = re.sub(r'^user-invocable: (true|false)\n', '', frontmatter, flags=re.MULTILINE)

    # Convert model names
    for short, full in MODEL_MAP.items():
        frontmatter = re.sub(rf'^model: {short}$', f'model: {full}', frontmatter, flags=re.MULTILINE)

    if file_type == 'command' and 'agent:' not in frontmatter:
        frontmatter = re.sub(r'(description: [^\n]+\n)', r'\1agent: build\n', frontmatter)
    elif file_type == 'agent' and 'mode:' not in frontmatter:
        frontmatter = frontmatter.rstrip() + '\nmode: subagent\n'

    return f'---{frontmatter}---{body}'


def transform_tools(content: str) -> str:
    """Convert tools: comma list to YAML permission object."""
    match = re.search(r'^tools: (.+)$', content, re.MULTILINE)
    if match:
        tools = [t.strip() for t in match.group(1).split(',')]
        perms = sorted(set(TOOL_MAP[t] for t in tools if t in TOOL_MAP))
        yaml = 'tools:\n' + ''.join(f'  {p}: allow\n' for p in perms)
        content = re.sub(r'^tools: .+$', yaml.rstrip(), content, flags=re.MULTILINE)
    return content


def transform_content(content: str) -> str:
    """Transform Skill() calls to /command format."""
    # Skill("plugin:name", "args") → /name args
    content = re.sub(r'Skill\s*\(\s*"[\w-]+:([\w-]+)"\s*,\s*"([^"]*)"\s*\)', r'/\1 \2', content)
    # Skill("plugin:name") → /name
    content = re.sub(r'Skill\s*\(\s*"[\w-]+:([\w-]+)"\s*\)', r'/\1', content)
    return content


def process_file(filepath: str, file_type: str) -> None:
    """Process a single file."""
    with open(filepath) as f:
        content = f.read()

    content = transform_frontmatter(content, file_type)
    if file_type == 'agent':
        content = transform_tools(content)
    content = transform_content(content)

    with open(filepath, 'w') as f:
        f.write(content)


def main():
    pattern = sys.argv[1] if len(sys.argv) > 1 else './vibe-*'

    # Process commands
    for f in glob.glob(f'{pattern}/commands/*.md'):
        process_file(f, 'command')
        print(f'  command: {f}')

    # Process agents
    for f in glob.glob(f'{pattern}/agents/*.md'):
        process_file(f, 'agent')
        print(f'  agent: {f}')

    # Process skills
    for f in glob.glob(f'{pattern}/skills/*/SKILL.md'):
        process_file(f, 'skill')
        print(f'  skill: {f}')

    print('Done')


if __name__ == '__main__':
    main()
