#!/usr/bin/env python3
"""Transform copied Claude Code plugin files to OpenCode format.

This script applies transformations according to the CONVERSION_GUIDE.md:
1. Commands: Remove name:, add agent: build, convert models
2. Agents: Remove name:, add mode: subagent, convert tools to permissions
3. Skills: KEEP name:, remove user-invocable:, convert models
4. Skill() calls: Convert based on target type:
   - User-invocable targets → /command format
   - Non-user-invocable targets → skill({ name: "..." }) format
"""

import re
import glob
import sys
import os

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

# Track non-user-invocable skills globally (populated during discovery)
NON_USER_INVOCABLE_SKILLS = set()


def discover_non_user_invocable_skills(pattern: str) -> set:
    """Scan all skill directories to find non-user-invocable skills.

    A skill is non-user-invocable if:
    1. It has 'user-invocable: false' in frontmatter, OR
    2. It has supporting files (not just SKILL.md) in its directory

    Path structure: ./<plugin>/skill/<skill-name>/SKILL.md
    """
    skills = set()
    for skill_file in glob.glob(f'{pattern}/skill/*/SKILL.md'):
        skill_dir = os.path.dirname(skill_file)  # ./<plugin>/skill/<skill-name>
        skill_name = os.path.basename(skill_dir)  # <skill-name>
        # Go up TWO levels: skill_dir -> skill -> plugin
        skill_parent = os.path.dirname(skill_dir)  # ./<plugin>/skill
        plugin_dir = os.path.dirname(skill_parent)  # ./<plugin>
        plugin_name = os.path.basename(plugin_dir)  # <plugin>

        # Check for user-invocable: false in frontmatter
        with open(skill_file) as f:
            content = f.read()
        if 'user-invocable: false' in content:
            skills.add((plugin_name, skill_name))
            continue

        # Check for supporting files (references/, scripts, etc.)
        entries = os.listdir(skill_dir)
        if len(entries) > 1:  # More than just SKILL.md
            skills.add((plugin_name, skill_name))

    return skills


def transform_frontmatter(content: str, file_type: str) -> str:
    """Transform YAML frontmatter based on file type.

    - Commands/Agents: Remove name: (filename is the name)
    - Skills: KEEP name: (required for skill discovery)
    """
    parts = content.split('---', 2)
    if len(parts) < 3:
        return content

    frontmatter, body = parts[1], parts[2]

    # Remove name: line ONLY for commands and agents, NOT skills
    if file_type != 'skill':
        frontmatter = re.sub(r'^name: [^\n]+\n', '', frontmatter, flags=re.MULTILINE)

    # Remove user-invocable: line (all file types)
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


def transform_skill_calls(content: str) -> str:
    """Transform Skill() calls based on target type.

    User-invocable targets: Skill("plugin:name") → /name
    Non-user-invocable targets: Skill("plugin:name") → skill({ name: "name" })
    """
    def replace_skill_call(match):
        plugin = match.group(1)
        skill_name = match.group(2)
        args = match.group(3) if match.lastindex >= 3 else None

        # Check if this skill is non-user-invocable
        is_non_user_invocable = (plugin, skill_name) in NON_USER_INVOCABLE_SKILLS

        if is_non_user_invocable:
            if args:
                return f'skill({{ name: "{skill_name}", arguments: "{args}" }})'
            else:
                return f'skill({{ name: "{skill_name}" }})'
        else:
            # User-invocable → slash command
            if args:
                return f'/{skill_name} {args}'
            else:
                return f'/{skill_name}'

    # Match Skill("plugin:name") and Skill("plugin:name", "args")
    # Pattern captures: (plugin), (skill_name), optional (args)
    content = re.sub(
        r'Skill\s*\(\s*"([\w-]+):([\w-]+)"\s*(?:,\s*"([^"]*)")?\s*\)',
        replace_skill_call,
        content
    )
    return content


def transform_task_references(content: str) -> str:
    """Transform Task tool references.

    'Task tool with subagent_type="plugin:agent"' → 'the agent agent'
    """
    content = re.sub(
        r'Task tool with subagent_type="[\w-]+:([\w-]+)"',
        r'the \1 agent',
        content
    )
    return content


def process_file(filepath: str, file_type: str) -> None:
    """Process a single file with all transformations."""
    with open(filepath) as f:
        content = f.read()

    content = transform_frontmatter(content, file_type)
    if file_type == 'agent':
        content = transform_tools(content)
    content = transform_skill_calls(content)
    content = transform_task_references(content)

    with open(filepath, 'w') as f:
        f.write(content)


def main():
    global NON_USER_INVOCABLE_SKILLS
    pattern = sys.argv[1] if len(sys.argv) > 1 else './vibe-*'

    # Phase 1: Discover non-user-invocable skills
    print('Discovering non-user-invocable skills...')
    NON_USER_INVOCABLE_SKILLS = discover_non_user_invocable_skills(pattern)
    if NON_USER_INVOCABLE_SKILLS:
        print(f'  Found: {sorted(NON_USER_INVOCABLE_SKILLS)}')
    else:
        print('  None found')

    # Phase 2: Transform files
    print('\nTransforming files...')

    # Process commands
    for f in glob.glob(f'{pattern}/command/*.md'):
        process_file(f, 'command')
        print(f'  command: {f}')

    # Process agents
    for f in glob.glob(f'{pattern}/agent/*.md'):
        process_file(f, 'agent')
        print(f'  agent: {f}')

    # Process skills
    for f in glob.glob(f'{pattern}/skill/*/SKILL.md'):
        process_file(f, 'skill')
        print(f'  skill: {f}')

    print('\nDone')


if __name__ == '__main__':
    main()
