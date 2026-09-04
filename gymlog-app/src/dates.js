// ── Dates ─────────────────────────────────────────────────────
// Always local, never UTC. `toISOString()` shifts the calendar day for any
// non-UTC timezone (at UTC+5:30 anything before 05:30 lands on yesterday),
// and date strings are the join key for sessions, weights and steps.
function localISO(d=new Date()){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function parseISO(iso){
  const [y,m,d]=String(iso).split("-").map(Number);
  return new Date(y,(m||1)-1,d||1);
}
function fmtDate(iso){ return parseISO(iso).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}); }
function shortDate(iso){ return parseISO(iso).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}); }

export { localISO, parseISO, fmtDate, shortDate };
