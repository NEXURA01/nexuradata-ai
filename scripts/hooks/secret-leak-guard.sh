#!/usr/bin/env bash
# secret-leak-guard.sh
# PreToolUse hook — blocks terminal commands that would print likely secrets.

set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null || true)

if [ "$TOOL_NAME" != "run_in_terminal" ]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null || true)
PRINT_CMD='(echo|cat|print|printf|Write-Output|Get-Content)'
SECRET_NAME='(_KEY|_SECRET|_TOKEN|_DSN|_PASSWORD|API_KEY|AUTH_TOKEN|WEBHOOK_SECRET|DATABASE_URL|SUPABASE_|SERVICE_ROLE)'

if echo "$COMMAND" | grep -qiE "${PRINT_CMD}.*${SECRET_NAME}"; then
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"BLOCKED: This command would print a likely secret value. Check whether the variable is set without echoing its contents."}}\n'
  exit 2
fi

exit 0
