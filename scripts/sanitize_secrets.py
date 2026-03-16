#!/usr/bin/env python3
"""Sanitize workspace files by redacting likely secret values.

This script creates a `.bak` backup for each file it modifies.
Run and review the backups before pushing.
"""
import re
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
SKIP_EXT = {'.png', '.jpg', '.jpeg', '.gif', '.pdf', '.docx', '.xlsx', '.zip', '.exe', '.dll', '.so'}

KEY_PATTERN = re.compile(r'(?i)(["\']?(?:api[_-]?key|api[_-]?token|token|secret|password|access[_-]?token|aws_access_key_id|aws_secret_access_key|sendgrid|twilio)["\']?\s*[:=]\s*)(["\'])(.*?)(["\'])')
ENV_PATTERN = re.compile(r'(?im)^(\s*(?:API_KEY|API_TOKEN|TOKEN|SECRET|PASSWORD|ACCESS_TOKEN|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY)\s*=\s*)(.*)$')

def is_text_file(p: Path) -> bool:
    return p.suffix.lower() not in SKIP_EXT

def redact_text(text: str) -> (str, bool):
    changed = False
    def _repl(m):
        nonlocal changed
        changed = True
        return f"{m.group(1)}{m.group(2)}REDACTED{m.group(4)}"
    text, n1 = KEY_PATTERN.subn(_repl, text)
    text, n2 = ENV_PATTERN.subn(lambda m: m.group(1) + 'REDACTED', text)
    if n1 or n2:
        changed = True
    return text, changed

def main():
    changed_files = []
    for p in ROOT.rglob('*'):
        if p.is_file() and is_text_file(p):
            try:
                s = p.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                continue
            new_s, changed = redact_text(s)
            if changed:
                bak = p.with_suffix(p.suffix + '.bak')
                shutil.copy2(p, bak)
                p.write_text(new_s, encoding='utf-8')
                changed_files.append(str(p.relative_to(ROOT)))
    if changed_files:
        print('Redacted values in:')
        for f in changed_files:
            print(' -', f)
        print('\nBackups saved with .bak suffix alongside originals. Review before pushing.')
    else:
        print('No likely secrets found/redacted.')

if __name__ == '__main__':
    main()
