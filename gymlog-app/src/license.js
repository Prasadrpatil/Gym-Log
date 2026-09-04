// ── LOCK SYSTEM ──────────────────────────────────────────────
const LOCK_KEY = "gymlog/lock";

// ── Shared secret — must match KeyGen exactly ─────────────────
// This is what prevents anyone forging their own tokens.
// Change this string in BOTH apps if you want to rotate the secret.
const GYMLOG_SECRET = "GymLog#Prasad@2026$Unlock!Secret^Key";

// ── djb2-HMAC: fast, no async, works in any WebView ──────────
// Not cryptographic-grade but strong enough to prevent casual forgery
// since the secret is compiled into the APK.
function hmacSign(message) {
  const key = GYMLOG_SECRET;
  // Inner hash: hash(key + message)
  function djb2(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h, 33) ^ s.charCodeAt(i);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  }
  // Two-pass to simulate HMAC inner/outer
  const inner = djb2(key + message);
  const outer = djb2(message + key + inner);
  // 16-char hex signature
  return (inner + outer).toUpperCase();
}

function getUnlockExp() {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return null;
    const { exp } = JSON.parse(raw);
    return exp || null;
  } catch { return null; }
}

function saveUnlockExp(exp) {
  try { localStorage.setItem(LOCK_KEY, JSON.stringify({ exp })); } catch {}
}

function isUnlocked() {
  const exp = getUnlockExp();
  return exp ? new Date(exp) > new Date() : false;
}

// ── LOCK SCREEN ──────────────────────────────────────────
// Token format: GYMLOG|CODE:XXXX-XXXX-XXXX|EXP:1710000000000|SIG:XXXXXXXXXXXXXXXX
// SIG = hmacSign("GYMLOG|CODE:...|EXP:...") — prevents forged tokens
function parseToken(raw) {
  const s = (raw || "").trim();
  if (!s.startsWith("GYMLOG|")) return null;
  const codeMatch = s.match(/CODE:([A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4})/);
  const expMatch  = s.match(/EXP:(\d+)/);
  const sigMatch  = s.match(/SIG:([A-F0-9]{16})/);
  if (!codeMatch || !expMatch || !sigMatch) return null;
  const expMs = parseInt(expMatch[1], 10);
  if (isNaN(expMs)) return null;
  // Reconstruct the signed payload (everything before |SIG:)
  const sigIdx   = s.lastIndexOf("|SIG:");
  const payload  = s.slice(0, sigIdx);
  const expected = hmacSign(payload);
  if (sigMatch[1] !== expected) return null; // forged token
  return { code: codeMatch[1], expMs };
}

export { LOCK_KEY, GYMLOG_SECRET, hmacSign, getUnlockExp, saveUnlockExp, isUnlocked, parseToken };
