let input = "";

for await (const chunk of process.stdin) {
  input += chunk;
}

const normalizedInput = input.replace(/^\uFEFF/, "").replace(/\u0000/g, "").trim();

if (!normalizedInput) {
  process.exit(0);
}

let payload;

try {
  payload = JSON.parse(normalizedInput);
} catch {
  process.exit(0);
}

const toolName = String(payload.tool_name || "");
const toolText = JSON.stringify(payload.tool_input || {});

function writeDecision(permissionDecision, permissionDecisionReason) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision,
      permissionDecisionReason
    }
  }));
}

const supabaseTokenLiteral = /(sbp_|sb_secret_)[A-Za-z0-9_-]{16,}/i;

if (supabaseTokenLiteral.test(toolText)) {
  writeDecision(
    "deny",
    "BLOCKED: A Supabase token literal was detected. Do not pass tokens through chat, terminal commands, patches, or committed files. Rotate the token and enter the replacement directly into a trusted secret store or CLI prompt."
  );
  process.exit(2);
}

const neonPattern = /(@neondatabase|api\.neon\.tech|neon-branch|migrations[\\/]+neon|wrangler\s+secret\s+put\s+DATABASE_URL|psql[^;&|]*DATABASE_URL|npm\s+(install|add)[^;&|]*@neondatabase|DATABASE_URL|(^|[^A-Za-z0-9_-])neon([^A-Za-z0-9_-]|$))/i;
const readOnlyPattern = /(^|[;&|\s])(git\s+status|git\s+diff|git\s+show|git\s+grep|Get-Content|Select-String|Test-Path|Get-ChildItem|npm\s+ls|cat|type|grep|findstr|where)([;&|\s]|$)/i;

if (neonPattern.test(toolText)) {
  if (toolName === "run_in_terminal" && readOnlyPattern.test(toolText)) {
    process.exit(0);
  }

  writeDecision(
    "ask",
    "Neon reference detected. This repo is moving to Supabase; continue only for explicit cleanup/removal or verified legacy migration work."
  );
}
