#!/usr/bin/env bash
# run-prd.sh — jalankan prompt PRD SkillGig ke Claude CLI.
# Usage:
#   ./run-prd.sh p1a           # pakai prompt dari prompts/p1a.md (context opsional)
#   ./run-prd.sh p1a --ctx web # tambahkan konteks folder 'web/'
#   ./run-prd.sh --list        # tampilkan prompt yang tersedia

set -euo pipefail

# --- Paths ---------------------------------------------------------------
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROMPTS_DIR="${SCRIPT_DIR}/prompts"
WEB_DIR="${SCRIPT_DIR}/web"

# --- Helpers -------------------------------------------------------------
die() { printf '❌ %s\n' "$*" >&2; exit 1; }
log() { printf '▶ %s\n' "$*"; }

usage() {
  cat <<'EOF'
run-prd.sh — eksekusi prompt PRD SkillGig via Claude CLI

Usage:
  run-prd.sh <section> [--ctx <folder>]
  run-prd.sh --list
  run-prd.sh -h | --help

Argumen:
  <section>            ID prioritas PRD (mis. p1a, p1b, p2c).
                       File prompt: prompts/<section>.md
  --ctx <folder>       Sertakan path folder sbg konteks tambahan
                       (mis. --ctx web akan menempel isi path web/ ke prompt).
  --list               Tampilkan semua prompt yang tersedia.
  -h, --help           Tampilkan bantuan.

Environment:
  CLAUDE_MODEL         Override model (default: pakai default claude CLI).
  CLAUDE_EXTRA_ARGS    Argumen ekstra diteruskan ke `claude -p`.
EOF
}

list_prompts() {
  if [[ -d "$PROMPTS_DIR" ]]; then
    log "Prompt tersedia di ${PROMPTS_DIR}:"
    find "$PROMPTS_DIR" -maxdepth 1 -type f -name '*.md' \
      -exec basename {} .md \; | sort | sed 's/^/  - /'
  else
    log "Folder prompts/ belum ada di ${PROMPTS_DIR}."
  fi
}

# --- Parse args ----------------------------------------------------------
if [[ $# -eq 0 ]]; then
  usage; exit 1
fi

SECTION=""
CTX_DIR=""
LIST_ONLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --list) LIST_ONLY=1; shift ;;
    --ctx)
      [[ $# -ge 2 ]] || die "--ctx butuh argumen folder"
      CTX_DIR="$2"; shift 2 ;;
    --ctx=*)
      CTX_DIR="${1#*=}"; shift ;;
    -*)
      die "Flag tidak dikenal: $1 (coba --help)" ;;
    *)
      [[ -z "$SECTION" ]] || die "Hanya boleh satu section ID"
      SECTION="$1"; shift ;;
  esac
done

if (( LIST_ONLY )); then list_prompts; exit 0; fi

[[ -n "$SECTION" ]] || die "Section ID wajib diisi (mis. p1a)"
[[ "$SECTION" =~ ^[a-zA-Z0-9_-]+$ ]] || die "Section ID tidak valid: $SECTION"

PROMPT_FILE="${PROMPTS_DIR}/${SECTION}.md"
[[ -f "$PROMPT_FILE" ]] || die "Prompt tidak ditemukan: ${PROMPT_FILE}
→ Buat file prompts/${SECTION}.md berisi instruksi untuk Claude."

# --- Build prompt --------------------------------------------------------
log "Section:    ${SECTION}"
log "Prompt:     ${PROMPT_FILE}"

PROMPT="$(cat "$PROMPT_FILE")"

if [[ -n "$CTX_DIR" ]]; then
  RESOLVED_CTX="${SCRIPT_DIR}/${CTX_DIR}"
  [[ -e "$RESOLVED_CTX" ]] || die "Folder konteks tidak ada: ${RESOLVED_CTX}"
  log "Context:    ${RESOLVED_CTX}"
  PROMPT="${PROMPT}

---

## Konteks tambahan: ${CTX_DIR}

Bekerja pada folder: ${RESOLVED_CTX}

Ringkasan struktur (dari \`tree -L 2\`):
\`\`\`
$(cd "$RESOLVED_CTX" && find . -maxdepth 2 -not -path '*/node_modules*' -not -path '*/.next*' -not -path '*/.git*' | sort)
\`\`\`"
fi

# --- Invoke Claude CLI ---------------------------------------------------
CLAUDE_ARGS=(-p "$PROMPT")
if [[ -n "${CLAUDE_MODEL:-}" ]]; then
  CLAUDE_ARGS+=(--model "$CLAUDE_MODEL")
fi
if [[ -n "${CLAUDE_EXTRA_ARGS:-}" ]]; then
  # shellcheck disable=SC2206  # word splitting intentional for arg passthrough
  CLAUDE_ARGS+=(${CLAUDE_EXTRA_ARGS})
fi

# Auto-skip permission prompts unless user explicitly disabled via env var.
# Set CLAUDE_INTERACTIVE=1 to opt back into the approval flow.
if [[ "${CLAUDE_INTERACTIVE:-0}" != "1" ]]; then
  CLAUDE_ARGS+=(--dangerously-skip-permissions)
fi

log "Menjalankan: claude ${CLAUDE_ARGS[*]:0:3} ..."
echo "----------------------------------------"
claude "${CLAUDE_ARGS[@]}"