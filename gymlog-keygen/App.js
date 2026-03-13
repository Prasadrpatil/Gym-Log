import React, { useState, useEffect, useRef } from "react";

const C = { green:"#c8f72c", bg:"#0a0a0a", card:"#111", border:"#1a1a1a", text:"#e8e8e8", muted:"#484848", red:"#e8341a" };
const T = { fontFamily:"'DM Mono','Courier New',monospace" };

// ── Shared secret ─────────────────────────────────────────────
const GYMLOG_SECRET = "GymLog#Prasad@2026$Unlock!Secret^Key";

function hmacSign(message) {
  const key = GYMLOG_SECRET;
  function djb2(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = Math.imul(h, 33) ^ s.charCodeAt(i);
    return (h >>> 0).toString(16).padStart(8, "0");
  }
  const inner = djb2(key + message);
  const outer = djb2(message + key + inner);
  return (inner + outer).toUpperCase();
}

function makeToken(code, expMs) {
  const payload = `GYMLOG|CODE:${code}|EXP:${expMs}`;
  return `${payload}|SIG:${hmacSign(payload)}`;
}

// ── Code generator ────────────────────────────────────────────
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode() {
  let s = "";
  for (let i = 0; i < 12; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `${s.slice(0,4)}-${s.slice(4,8)}-${s.slice(8,12)}`;
}

// ── Storage ───────────────────────────────────────────────────
const STORAGE_KEY = "gymlog-keygen/users";
function loadUsers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveUsers(users) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); } catch {}
}

// ── Helpers ───────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10); }

function timeUntil(ms) {
  const diff = ms - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtDate(ms) {
  return new Date(ms).toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
}

// ── QR Code ───────────────────────────────────────────────────
function QRCode({ payload, size = 200 }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [payload]);
  if (!payload) return null;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}&color=000000&bgcolor=ffffff&qzone=2&format=svg`;
  if (err) return (
    <div style={{width:size,height:size,background:"#f5f5f5",borderRadius:8,display:"flex",
      flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,color:"#999",fontSize:10}}>
      <span style={{fontSize:24}}>📵</span><span>Needs internet</span>
    </div>
  );
  return (
    <div style={{background:"#fff",padding:10,borderRadius:10,display:"inline-block"}}>
      <img src={url} width={size} height={size} alt="QR" onError={()=>setErr(true)} style={{display:"block"}}/>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const inp = (extra={}) => ({
  background:"#0d0d0d", border:"1px solid #252525", borderRadius:8,
  color:C.text, padding:"12px 14px", fontSize:13, ...T,
  outline:"none", width:"100%", ...extra,
});
const sLbl = { fontSize:9, color:C.muted, letterSpacing:3, textTransform:"uppercase", marginBottom:10 };
const cardStyle = { background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", marginBottom:12 };

// ═══════════════════════════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════════════════════════

// ── User List (Home) ──────────────────────────────────────────
function UserList({ users, onSelect, onAdd, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);
  const now = Date.now();
  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,...T,fontSize:14,paddingBottom:80}}>
      <div style={{background:"#0d0d0d",borderBottom:`1px solid ${C.border}`,padding:"52px 18px 18px",
        display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:9,color:"#333",letterSpacing:4,textTransform:"uppercase",marginBottom:4}}>GymLog · Admin</div>
          <div style={{fontSize:22,fontWeight:700,color:C.green,letterSpacing:2}}>Key Generator</div>
          <div style={{fontSize:10,color:"#3a3a3a",marginTop:4}}>{users.length} user{users.length!==1?"s":""}</div>
        </div>
        <button onClick={onAdd}
          style={{background:C.green,border:"none",color:"#000",borderRadius:10,
            padding:"12px 18px",fontSize:12,fontWeight:700,letterSpacing:1,...T,cursor:"pointer"}}>
          + New User
        </button>
      </div>

      <div style={{padding:"16px 18px"}}>
        {users.length===0?(
          <div style={{textAlign:"center",padding:"60px 20px",color:"#2a2a2a"}}>
            <div style={{fontSize:40,marginBottom:12}}>👤</div>
            <div style={{fontSize:12,letterSpacing:2,textTransform:"uppercase"}}>No users yet</div>
            <div style={{fontSize:10,marginTop:8,color:"#1e1e1e"}}>Tap + New User to create one</div>
          </div>
        ):(
          users.map(u => {
            const active = u.key && u.key.expMs > now;
            const remaining = u.key ? timeUntil(u.key.expMs) : null;
            return (
              <div key={u.id}
                onClick={()=>onSelect(u)}
                style={{...cardStyle,cursor:"pointer",display:"flex",alignItems:"center",gap:12,
                  transition:"border-color 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#2a2a2a"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                {/* Avatar */}
                <div style={{width:44,height:44,borderRadius:22,flexShrink:0,
                  background: active?"#0d1a00":"#1a1a1a",
                  border:`2px solid ${active?"#2a4400":C.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:18,fontWeight:700,color:active?C.green:"#444"}}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:2}}>{u.name}</div>
                  {u.key?(
                    <div style={{fontSize:10,color:active?"#4a7a10":"#555",letterSpacing:0.5}}>
                      {active ? `🟢 Active · expires in ${remaining}` : `🔴 Expired · ${fmtDate(u.key.expMs)}`}
                    </div>
                  ):(
                    <div style={{fontSize:10,color:"#333",letterSpacing:0.5}}>No key generated</div>
                  )}
                </div>
                {/* Delete */}
                {confirmId===u.id?(
                  <div style={{display:"flex",gap:6,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                    <button onClick={e=>{e.stopPropagation();onDelete(u.id);setConfirmId(null);}}
                      style={{background:"#2a0000",border:`1px solid ${C.red}`,color:C.red,
                        borderRadius:6,padding:"5px 10px",fontSize:10,cursor:"pointer",...T,letterSpacing:1}}>
                      Delete
                    </button>
                    <button onClick={e=>{e.stopPropagation();setConfirmId(null);}}
                      style={{background:"#141414",border:"1px solid #252525",color:"#555",
                        borderRadius:6,padding:"5px 10px",fontSize:10,cursor:"pointer",...T}}>
                      Cancel
                    </button>
                  </div>
                ):(
                  <button
                    onClick={e=>{e.stopPropagation();setConfirmId(u.id);}}
                    style={{background:"none",border:"none",color:"#2a2a2a",fontSize:16,
                      cursor:"pointer",padding:"4px 8px",flexShrink:0,...T}}
                    onMouseEnter={e=>e.currentTarget.style.color=C.red}
                    onMouseLeave={e=>e.currentTarget.style.color="#2a2a2a"}>
                    ✕
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Add User Modal ────────────────────────────────────────────
function AddUserModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const ref = useRef(null);
  useEffect(() => { setTimeout(()=>ref.current?.focus(), 100); }, []);

  function submit() {
    const n = name.trim();
    if (!n) return;
    onAdd(n);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,
      display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={onClose}>
      <div style={{background:"#111",border:`1px solid ${C.border}`,borderRadius:"16px 16px 0 0",
        padding:"24px 20px 40px",width:"100%",maxWidth:500,...T}}
        onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:18,letterSpacing:1}}>New User</div>
        <input ref={ref} style={inp()} placeholder="Enter name (e.g. John)"
          value={name} onChange={e=>setName(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&submit()}
          autoCapitalize="words"/>
        <div style={{display:"flex",gap:10,marginTop:14}}>
          <button onClick={onClose}
            style={{flex:1,padding:"13px",borderRadius:10,border:`1px solid ${C.border}`,
              background:"transparent",color:C.muted,fontSize:13,...T,cursor:"pointer"}}>
            Cancel
          </button>
          <button onClick={submit} disabled={!name.trim()}
            style={{flex:2,padding:"13px",borderRadius:10,border:"none",
              background:name.trim()?C.green:"#1a1a1a",
              color:name.trim()?"#000":"#3a3a3a",
              fontSize:13,fontWeight:700,...T,cursor:"pointer"}}>
            Create User
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User Detail ───────────────────────────────────────────────
function UserDetail({ user, onBack, onSaveKey }) {
  const now = new Date();
  const [expDate, setExpDate] = useState("");
  const [expTime, setExpTime] = useState("");
  const [copied,  setCopied]  = useState(false);
  const [, tick]              = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick(n=>n+1), 60000);
    return () => clearInterval(id);
  }, []);

  const expiryDt = (expDate && expTime) ? new Date(`${expDate}T${expTime}:00`) : null;
  const isExpired = expiryDt ? expiryDt <= new Date() : false;
  const canGen    = expDate && expTime && !isExpired;
  const remaining = expiryDt ? timeUntil(expiryDt.getTime()) : null;

  // Active key info
  const hasKey    = !!user.key;
  const keyActive = hasKey && user.key.expMs > Date.now();
  const keyLeft   = hasKey ? timeUntil(user.key.expMs) : null;
  const token     = hasKey ? makeToken(user.key.code, user.key.expMs) : null;

  function setPreset(ms) {
    const dt = new Date(Date.now() + ms);
    setExpDate(dt.toISOString().slice(0,10));
    setExpTime(dt.toTimeString().slice(0,5));
  }

  function doGenerate() {
    if (!canGen) return;
    const code  = generateCode();
    const expMs = expiryDt.getTime();
    onSaveKey(user.id, { code, expMs, createdAt: Date.now() });
    setExpDate(""); setExpTime("");
  }

  function doCopy() {
    if (!token) return;
    navigator.clipboard?.writeText(token).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false), 2500);
  }

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,...T,fontSize:14,paddingBottom:60}}>
      <style>{`input:focus{border-color:#c8f72c!important;outline:none;}
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=time]::-webkit-calendar-picker-indicator{filter:invert(0.4);cursor:pointer;}`}
      </style>

      {/* Header */}
      <div style={{background:"#0d0d0d",borderBottom:`1px solid ${C.border}`,
        padding:"52px 18px 16px",display:"flex",alignItems:"center",gap:14}}>
        <button onClick={onBack}
          style={{background:"none",border:`1px solid #2a2a2a`,color:"#777",
            borderRadius:8,padding:"9px 14px",fontSize:12,...T,cursor:"pointer",letterSpacing:1}}>
          ← Back
        </button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:9,color:"#333",letterSpacing:4,textTransform:"uppercase",marginBottom:3}}>User</div>
          <div style={{fontSize:20,fontWeight:700,color:C.text,letterSpacing:1}}>{user.name}</div>
        </div>
        {/* Status badge */}
        <div style={{
          background: keyActive?"#0d1a00":"#1a0a00",
          border:`1px solid ${keyActive?"#2a4400":"#3a1000"}`,
          borderRadius:20,padding:"4px 10px",
          fontSize:9,fontWeight:700,letterSpacing:2,textTransform:"uppercase",
          color:keyActive?C.green:C.red,flexShrink:0}}>
          {keyActive?"Active":"Locked"}
        </div>
      </div>

      <div style={{padding:"16px 18px",maxWidth:500,margin:"0 auto"}}>

        {/* ── Current key card ── */}
        {hasKey&&(
          <div style={{...cardStyle,
            background: keyActive?"#0b0f00":"#0f0a0a",
            border:`1px solid ${keyActive?"#1e3000":"#2a1000"}`}}>
            <div style={{...sLbl,color:keyActive?"#3a5a10":"#4a2010"}}>
              {keyActive?"Current Key · Active":"Last Key · Expired"}
            </div>

            {/* Code */}
            <div style={{background:"#080808",border:"1px solid #1a1a1a",borderRadius:10,
              padding:"14px",textAlign:"center",marginBottom:12}}>
              <div style={{fontSize:10,color:"#2a2a2a",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Access Code</div>
              <div style={{fontSize:20,fontWeight:700,color:keyActive?C.green:"#555",letterSpacing:5,marginBottom:6}}>
                {user.key.code}
              </div>
              <div style={{fontSize:9,letterSpacing:1,
                color:keyActive?"#4a7a10":"#5a3010"}}>
                {keyActive
                  ? `⏱ Expires in ${keyLeft} · ${fmtDate(user.key.expMs)}`
                  : `⛔ Expired ${fmtDate(user.key.expMs)}`
                }
              </div>
            </div>

            {/* QR */}
            {keyActive&&(
              <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
                <QRCode payload={token} size={180}/>
              </div>
            )}

            {/* Copy */}
            {keyActive&&(
              <button onClick={doCopy}
                style={{width:"100%",padding:"11px",borderRadius:8,cursor:"pointer",...T,
                  fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",
                  border:`1px solid ${copied?"#2a4400":"#222"}`,
                  background:copied?"#0d1400":"#141414",
                  color:copied?C.green:"#555"}}>
                {copied?"✓  Copied Token":"Copy Token"}
              </button>
            )}

            {/* Created info */}
            {user.key.createdAt&&(
              <div style={{marginTop:10,fontSize:9,color:"#2a2a2a",textAlign:"center",letterSpacing:1}}>
                Generated {fmtDate(user.key.createdAt)}
              </div>
            )}
          </div>
        )}

        {/* ── Generate new key ── */}
        <div style={cardStyle}>
          <div style={sLbl}>{hasKey?"Generate New Key":"Generate Key"}</div>

          {/* Presets */}
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
            {[{l:"1h",ms:3600000},{l:"6h",ms:6*3600000},{l:"1d",ms:86400000},
              {l:"3d",ms:3*86400000},{l:"1w",ms:7*86400000},{l:"1mo",ms:30*86400000}
            ].map(({l,ms})=>(
              <button key={l} onClick={()=>setPreset(ms)}
                style={{background:"#0d0d0d",border:"1px solid #252525",color:"#777",
                  borderRadius:6,padding:"7px 11px",fontSize:10,cursor:"pointer",...T}}>
                {l}
              </button>
            ))}
          </div>

          <div style={{display:"flex",gap:10,marginBottom:10}}>
            <input type="date" value={expDate} min={now.toISOString().slice(0,10)}
              style={{...inp(),flex:1}} onChange={e=>setExpDate(e.target.value)}/>
            <input type="time" value={expTime}
              style={{...inp(),flex:1}} onChange={e=>setExpTime(e.target.value)}/>
          </div>

          {expiryDt&&(
            <div style={{marginBottom:12,padding:"8px 12px",borderRadius:8,fontSize:10,
              background:isExpired?"#1a0000":"#0d1400",
              border:`1px solid ${isExpired?"#3a0000":"#1e3000"}`,
              color:isExpired?"#e85d2a":"#4a8a10"}}>
              {isExpired?"⚠ Past time — pick future":`⏱ Active for ${remaining} · until ${expiryDt.toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}`}
            </div>
          )}

          <button onClick={doGenerate} disabled={!canGen}
            style={{width:"100%",padding:"14px",borderRadius:10,border:"none",
              background:canGen?C.green:"#151515",color:canGen?"#000":"#333",
              fontSize:13,fontWeight:700,letterSpacing:2,cursor:canGen?"pointer":"not-allowed",
              textTransform:"uppercase",...T}}>
            {hasKey?"⟳ Regenerate Key":"Generate Key"}
          </button>
        </div>

        {/* ── Key history — expired keys only ── */}
        {(()=>{
          const expired = (user.history||[]).filter(h=>h.expMs<=Date.now());
          if (!expired.length) return null;
          return (
            <div style={cardStyle}>
              <div style={sLbl}>Past Keys</div>
              {expired.slice().reverse().map((h,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",
                  padding:"7px 0",borderBottom:"1px solid #161616",fontSize:10,gap:8}}>
                  <span style={{color:"#2a2a2a",fontFamily:"monospace",letterSpacing:1}}>{h.code}</span>
                  <span style={{color:"#383838",flexShrink:0}}>Expired {fmtDate(h.expMs)}</span>
                </div>
              ))}
            </div>
          );
        })()}

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [users,    setUsers]    = useState(loadUsers);
  const [screen,   setScreen]   = useState("list"); // "list" | "detail"
  const [selUser,  setSelUser]  = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [, tick]                = useState(0);

  // Persist on every change
  useEffect(() => { saveUsers(users); }, [users]);

  // Refresh status badges every minute
  useEffect(() => {
    const id = setInterval(() => tick(n=>n+1), 60000);
    return () => clearInterval(id);
  }, []);

  function addUser(name) {
    const u = { id: uid(), name, key: null, history: [] };
    setUsers(prev => [...prev, u]);
    setShowAdd(false);
    // Navigate straight to the new user
    setSelUser(u);
    setScreen("detail");
  }

  function deleteUser(id) {
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  function saveKey(userId, keyData) {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const history = [...(u.history||[])];
      if (u.key) history.push(u.key); // archive old key
      const updated = { ...u, key: keyData, history };
      setSelUser(updated); // refresh detail view
      return updated;
    }));
  }

  function selectUser(u) {
    // Get latest version from state
    setSelUser(u);
    setScreen("detail");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        input:focus{border-color:#c8f72c!important;outline:none;}
        button:active{opacity:0.75;}
      `}</style>

      {screen==="list"&&(
        <UserList
          users={users}
          onSelect={selectUser}
          onAdd={()=>setShowAdd(true)}
          onDelete={deleteUser}
        />
      )}

      {screen==="detail"&&selUser&&(
        <UserDetail
          user={users.find(u=>u.id===selUser.id)||selUser}
          onBack={()=>setScreen("list")}
          onSaveKey={saveKey}
        />
      )}

      {showAdd&&<AddUserModal onAdd={addUser} onClose={()=>setShowAdd(false)}/>}
    </>
  );
}
