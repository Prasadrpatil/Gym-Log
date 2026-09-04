// ── Set input parsing ─────────────────────────────────────────
// A number input still yields "-5" and "1e3"; negatives would flow straight
// into volume and max-weight maths.
function validReps(v){ const n=parseInt(v,10); return Number.isFinite(n)&&n>0; }
function toReps(v){ const n=parseInt(v,10); return Number.isFinite(n)&&n>0?n:0; }
function toWeight(v){ const n=parseFloat(v); return Number.isFinite(n)&&n>=0?n:null; }

export { validReps, toReps, toWeight };
