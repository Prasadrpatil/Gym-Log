import React, { useState, useEffect, useRef, useCallback } from "react";
import chestImg    from './assets/muscles/chest.png';
import backImg     from './assets/muscles/back.png';
import bicepsImg   from './assets/muscles/biceps.png';
import tricepsImg  from './assets/muscles/triceps.png';
import legsImg     from './assets/muscles/legs.png';
import shouldersImg from './assets/muscles/shoulders.png';
import absImg      from './assets/muscles/abs.png';


// Storage: WebView localStorage, physical path on Android:
// /data/data/com.gymlog.app/app_webview/Default/Local Storage/leveldb/
// Access via Android Studio → View → Tool Windows → Device File Explorer
const STORAGE_KEY = "gymlog/v5/data";

// ── Constants ────────────────────────────────────────────────
const C = {green:"#c8f72c",bg:"#0a0a0a",card:"#111",border:"#1a1a1a",text:"#e8e8e8",muted:"#484848",dim:"#2a2a2a",red:"#e8341a"};
const T = {fontFamily:"'DM Mono','Courier New',monospace"};

const MUSCLE_COLORS={
  chest:"#e85d2a",back:"#2a7de8",legs:"#e8a22a",shoulders:"#9b2ae8",
  arms:"#2ae8a2",core:"#e82a6a",glutes:"#e8d42a",calves:"#2ae8d4",
  default:"#5a5a5a"
};

function getMuscleColor(name=""){
  const n=name.toLowerCase();
  if(n.includes("chest")||n.includes("pec")) return MUSCLE_COLORS.chest;
  if(n.includes("back")||n.includes("lat")||n.includes("trap")) return MUSCLE_COLORS.back;
  if(n.includes("leg")||n.includes("quad")||n.includes("hamstr")||n.includes("calf")||n.includes("calves")) return MUSCLE_COLORS.legs;
  if(n.includes("shoulder")||n.includes("delt")) return MUSCLE_COLORS.shoulders;
  if(n.includes("arm")||n.includes("bicep")||n.includes("tricep")||n.includes("forearm")) return MUSCLE_COLORS.arms;
  if(n.includes("core")||n.includes("ab")||n.includes("oblique")) return MUSCLE_COLORS.core;
  if(n.includes("glute")||n.includes("hip")) return MUSCLE_COLORS.glutes;
  return MUSCLE_COLORS.default;
}

function uid(){ return Math.random().toString(36).slice(2,10)+Date.now().toString(36); }
function fmtDate(iso){ return new Date(iso).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}); }

// ── Exercise data ─────────────────────────────────────────────
function makeExercises(names){ return names.map((n,i)=>({id:`e_${n.replace(/\s+/g,"_").toLowerCase()}`,name:n,sessions:[]})); }

const DEFAULT_MUSCLES=[
  {id:"m1",name:"Chest", exercises:makeExercises([
    "Barbell Bench Press","Incline Barbell Bench Press","Decline Barbell Bench Press",
    "Reverse Grip Bench Press","Close Grip Bench Press",
    "Dumbbell Bench Press","Incline Dumbbell Press","Decline Dumbbell Press",
    "Dumbbell Fly","Incline Dumbbell Fly","Decline Dumbbell Fly","Dumbbell Pullover",
    "Smith Machine Bench Press","Smith Machine Incline Press","Smith Machine Decline Press",
    "Cable Fly (High to Low)","Cable Fly (Low to High)","Cable Fly (Mid)",
    "Pec Deck Machine","Chest Press Machine","Plate Loaded Chest Press",
    "Push-ups","Wide Push-ups","Decline Push-ups","Weighted Push-ups","Chest Dips",
  ])},
  {id:"m2",name:"Back", exercises:makeExercises([
    "Deadlift","Romanian Deadlift","Stiff Leg Deadlift","Barbell Row","Pendlay Row",
    "Rack Pull","Meadows Row",
    "Single Arm Dumbbell Row","Dumbbell Row","Incline Bench Dumbbell Row",
    "Smith Machine Row",
    "Lat Pulldown","Wide Grip Pulldown","Close Grip Pulldown","Reverse Grip Pulldown",
    "Seated Cable Row","Straight Arm Pulldown","Face Pull",
    "Pull-ups","Weighted Pull-ups","Chin-ups","Inverted Rows",
  ])},
  {id:"m3",name:"Shoulders", exercises:makeExercises([
    "Barbell Overhead Press","Seated Barbell Press","Push Press","Behind the Neck Press","Upright Row",
    "Dumbbell Shoulder Press","Arnold Press","Dumbbell Lateral Raise","Dumbbell Front Raise",
    "Rear Delt Fly","Dumbbell Shrugs",
    "Smith Machine Shoulder Press","Smith Machine Upright Row","Smith Machine Shrugs",
    "Cable Lateral Raise","Cable Front Raise","Cable Rear Delt Fly",
    "Machine Shoulder Press","Machine Lateral Raise","Reverse Pec Deck",
  ])},
  {id:"m4",name:"Biceps", exercises:makeExercises([
    "Barbell Curl","EZ Bar Curl","Reverse Curl",
    "Alternating Dumbbell Curl","Hammer Curl","Incline Dumbbell Curl",
    "Concentration Curl","Zottman Curl",
    "Cable Curl","Rope Cable Curl","Preacher Curl Machine","Cable Single Arm Curl",
  ])},
  {id:"m5",name:"Triceps", exercises:makeExercises([
    "Close Grip Bench Press","Skull Crushers","JM Press",
    "Overhead Dumbbell Extension","Seated Overhead Extension","Dumbbell Skull Crushers","Tricep Kickbacks",
    "Cable Pushdown","Rope Pushdown","Reverse Grip Pushdown","Cable Overhead Extension","Single Arm Pushdown",
    "Bench Dips","Parallel Bar Dips","Weighted Dips",
  ])},
  {id:"m6",name:"Legs", exercises:makeExercises([
    "Barbell Squat","Front Squat","Romanian Deadlift","Stiff Leg Deadlift","Good Mornings","Barbell Hip Thrust",
    "Dumbbell Squat","Goblet Squat","Walking Lunges","Reverse Lunges","Bulgarian Split Squat","Step Ups",
    "Smith Machine Squat","Smith Machine Lunges","Smith Machine Hip Thrust",
    "Leg Press","Hack Squat","Leg Extension","Leg Curl (Lying)","Leg Curl (Seated)",
    "Standing Calf Raise","Seated Calf Raise","Leg Press Calf Raise","Donkey Calf Raise",
  ])},
  {id:"m7",name:"Abs", exercises:makeExercises([
    "Crunches","Weighted Crunch","Cable Crunch","Decline Sit-ups",
    "Hanging Leg Raise","Hanging Knee Raise","Reverse Crunch",
    "Russian Twist","Weighted Russian Twist",
    "Plank","Side Plank","Ab Wheel Rollout","V-Ups","Toe Touches","Mountain Climbers",
  ])},
].map(m=>({...m,lastEdited:Date.now(),exercises:m.exercises.map(e=>({...e,sessions:[]}))}));

function initData(){
  try{
    const raw=localStorage.getItem("gymlog/v5/data");
    if(raw){ const d=JSON.parse(raw); if(d?.users?.length) return d; }
  }catch{}
  const u=makeDefaultUser("Me");
  return {users:[u],activeUserId:u.id};
}

// ── Default first user ───────────────────────────────────────
function makeDefaultUser(name="Me"){
  return { id: uid0(), name, muscles: DEFAULT_MUSCLES.map(m=>({...m,exercises:m.exercises.map(e=>({...e,sessions:[]})) })) };
}
function uid0(){ return Math.random().toString(36).slice(2,10)+Date.now().toString(36); }

// ── Muscle icons ────────────────────────────────────────────
// Images live at: gymlog-app/src/assets/muscles/
// chest.png | back.png | biceps.png | triceps.png
// legs.png  | shoulders.png | abs.png
const MUSCLE_IMGS = {
  Chest:     chestImg,
  Back:      backImg,
  Biceps:    bicepsImg,
  Triceps:   tricepsImg,
  Legs:      legsImg,
  Shoulders: shouldersImg,
  Abs:       absImg,
};

const MuscleIcon = ({ muscle, size = 48, showColor = false }) => {
  const src = MUSCLE_IMGS[muscle];
  const color = getMuscleColor(muscle||"");
  if (!src) {
    // fallback circle for unknown muscles
    return (
      <div style={{
        width:size, height:size, borderRadius:'50%', flexShrink:0,
        background: showColor ? color+"33" : "#1e1e1e",
        border: `2px solid ${showColor ? color : "#2a2a2a"}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: size*0.35, color: showColor ? color : "#484848"
      }}>?</div>
    );
  }
  return (
    <div style={{position:'relative', width:size, height:size, flexShrink:0}}>
      <img
        src={src}
        width={size}
        height={size}
        style={{objectFit:'contain', display:'block'}}
        alt={muscle}
      />
      {showColor && (
        <div style={{
          position:'absolute', bottom:0, left:'50%',
          transform:'translateX(-50%)',
          width:size*0.5, height:3, borderRadius:2,
          background:color, opacity:0.9
        }}/>
      )}
    </div>
  );
};
function getAllSessions(muscles){
  const out=[];
  muscles.forEach(m=>m.exercises.forEach(e=>e.sessions.forEach(s=>{
    if(!s.sets||s.sets.length===0) return; // skip empty sessions
    out.push({...s,mId:m.id,mName:m.name,eName:e.name,eId:e.id});
  })));
  return out.sort((a,b)=>{
    const dateDiff=new Date(b.date)-new Date(a.date);
    if(dateDiff!==0) return dateDiff;
    // same date — sort by dayOrder if set
    return (a.dayOrder??999)-(b.dayOrder??999);
  });
}
function groupByDay(sessions){
  const map={};
  sessions.forEach(s=>{ if(!map[s.date]) map[s.date]=[]; map[s.date].push(s); });
  return Object.keys(map).sort((a,b)=>new Date(b)-new Date(a)).map(date=>({date,sessions:map[date]}));
}

// ── Scroll-aware floating button hook ───────────────────────
function useScrollVisible(containerRef){
  const [visible,setVisible]=useState(true);
  const lastY=useRef(0);
  useEffect(()=>{
    const el=containerRef.current;
    if(!el) return;
    const fn=()=>{
      const y=el.scrollTop;
      if(y<60){ setVisible(true); lastY.current=y; return; }
      setVisible(y<lastY.current);
      lastY.current=y;
    };
    el.addEventListener("scroll",fn,{passive:true});
    return ()=>el.removeEventListener("scroll",fn);
  },[]);
  return visible;
}


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

export default function App(){
  const [data,    setData]    = useState(initData);
  const [screen,  setScreen]  = useState("home");
  const [viewDay, setViewDay] = useState(null);
  const [viewSid, setViewSid] = useState(null);
  const [viewEx,  setViewEx]  = useState(null);
  const [wizard,  setWizard]  = useState(null);
  const [sidebar, setSidebar] = useState(false);
  const [anatomyOpen, setAnatomyOpen] = useState(false);
  const [bwOpen, setBwOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [modal,   setModal]   = useState(null);
  const [sbOpen,  setSbOpen]  = useState({});
  const [calOpen, setCalOpen] = useState(false);  // calendar overlay
  const [expandedDay, setExpandedDay] = useState(null); // sid of inline-expanded exercise
  // ── Lock state ──────────────────────────────────────────
  const [locked, setLocked] = useState(() => !isUnlocked());

  function doUnlock(exp) {
    saveUnlockExp(exp);
    setLocked(false);
  }

  // Re-lock when expiry passes (check every minute)
  useEffect(() => {
    const id = setInterval(() => {
      if (!isUnlocked()) setLocked(true);
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const sideRef    = useRef(null);
  const sideSwipeRef = useRef(null);
  const scrollRef  = useRef(null);  // main scroll container for screens
  const wScrollRef = useRef(null);  // wizard scroll container
  const fabVisible    = useScrollVisible(scrollRef);
  const wizFabVisible = useScrollVisible(wScrollRef);

  // ── Active user helpers ──────────────────────────────────
  const activeUser = data.users.find(u=>u.id===data.activeUserId) || data.users[0];
  const muscles = activeUser?.muscles || [];

  const switchUser = (uid) => {
    setData(d=>({...d,activeUserId:uid}));
    setScreen("home"); setWizard(null); setModal(null);
  };
  const addUser = (name) => {
    const u = makeDefaultUser(name);
    setData(d=>({...d,users:[...d.users,u],activeUserId:u.id}));
    setScreen("home"); setWizard(null);
  };
  const delUser = (uid) => {
    setData(d=>{
      const users=d.users.filter(u=>u.id!==uid);
      const activeUserId=d.activeUserId===uid?(users[0]?.id||null):d.activeUserId;
      return {...d,users,activeUserId};
    });
  };
  const renameUser = (uid,name) => setData(d=>({...d,users:d.users.map(u=>u.id===uid?{...u,name}:u)}));

  // ── Update active user's muscles ─────────────────────────
  const setMuscles = (fn) => setData(d=>({...d,users:d.users.map(u=>u.id===activeUser.id?{...u,muscles:fn(u.muscles)}:u)}));

  useEffect(()=>{ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch{} },[data]);
  useEffect(()=>{
    if(!sidebar) return;
    const fn=e=>{ if(sideRef.current&&!sideRef.current.contains(e.target)) setSidebar(false); };
    document.addEventListener("mousedown",fn);
    document.addEventListener("touchstart",fn,{passive:true});
    return ()=>{ document.removeEventListener("mousedown",fn); document.removeEventListener("touchstart",fn); };
  },[sidebar]);

  // Swipe-right from left edge to open sidebar
  useEffect(()=>{
    if(sidebar||wizard||modal) return;
    let startX=null, startY=null;
    const onStart=e=>{
      const t=e.touches[0];
      if(t.clientX>40) return; // only trigger from left 40px edge
      startX=t.clientX; startY=t.clientY;
    };
    const onEnd=e=>{
      if(startX===null) return;
      const dx=e.changedTouches[0].clientX-startX;
      const dy=Math.abs(e.changedTouches[0].clientY-startY);
      if(dx>50&&dy<60) setSidebar(true);
      startX=null; startY=null;
    };
    document.addEventListener("touchstart",onStart,{passive:true});
    document.addEventListener("touchend",onEnd,{passive:true});
    return ()=>{ document.removeEventListener("touchstart",onStart); document.removeEventListener("touchend",onEnd); };
  },[sidebar,wizard,modal]);

  const capApp   = useRef(null);   // Capacitor App plugin ref for minimizeApp
  const timerMap = useRef({});     // sid -> {running,elapsed,start} — memory only, never persisted
  const prevScreen = useRef("home"); // track where ExerciseDetail was opened from

  // Capacitor back button
  useEffect(()=>{
    let h=null;
    const go=async()=>{
      try{
        const {App}=await import('@capacitor/app');
        capApp.current=App;
        h=await App.addListener('backButton',handleBack);
      }catch{
        window.history.pushState({g:1},"");
        const fn=()=>{ window.history.pushState({g:1},""); handleBack(); };
        window.addEventListener("popstate",fn);
        h={remove:()=>window.removeEventListener("popstate",fn)};
      }
    };
    go(); return ()=>h?.remove();
  },[modal,sidebar,calOpen,anatomyOpen,bwOpen,stepsOpen,wizard,screen,viewDay,viewEx]);

  function handleBack(){
    if(modal){setModal(null);return;}
    if(calOpen){setCalOpen(false);return;}
    if(sidebar){setSidebar(false);return;}
    if(stepsOpen){setStepsOpen(false);return;}
    if(bwOpen){setBwOpen(false);return;}
    if(anatomyOpen){setAnatomyOpen(false);setScreen("home");return;}
    if(wizard){
      const {step}=wizard;
      if(step==="sets"){
        // Delete session if empty before going back
        if(wizard?.sid&&!getSess(wizard.mId,wizard.eId,wizard.sid)?.sets?.length){
          delSession(wizard.mId,wizard.eId,wizard.sid);
        }
        setWizard(w=>({...w,step:"exercise",sid:null}));return;
      }
      if(step==="exercise")    {setWizard(w=>({...w,step:"muscle",eId:null,sid:null}));return;}
      setWizard(null); return;
    }
    // exercise detail goes back to wherever it was opened from
    if(screen==="exercise"){ setScreen(prevScreen.current); return; }
    if(screen==="exHistory"){setScreen("home");return;}
    if(screen==="day")     {setScreen("home");return;}
    if(screen==="home"){
      try{ capApp.current?.minimizeApp(); }catch{}
    }
  }

  // ── Lookups ──────────────────────────────────────────────
  const getMuscle = mId => muscles.find(m=>m.id===mId);
  const getEx     = (mId,eId) => getMuscle(mId)?.exercises.find(e=>e.id===eId);
  const getSess   = (mId,eId,sid) => getEx(mId,eId)?.sessions.find(s=>s.id===sid);
  const sortEx    = es => [...es].sort((a,b)=>(b.lastEdited||0)-(a.lastEdited||0));
  const sortSess  = ss => [...ss].sort((a,b)=>new Date(b.date)-new Date(a.date));

  // ── Mutations ────────────────────────────────────────────
  const addMuscle  = n => setMuscles(ms=>[...ms,{id:uid(),name:n,lastEdited:Date.now(),exercises:[]}]);
  const delMuscle  = mId => setMuscles(ms=>ms.filter(m=>m.id!==mId));
  const addEx      = (mId,n)=>{
    const now=Date.now();
    setMuscles(ms=>ms.map(m=>{
      if(m.id!==mId) return m;
      const exists=m.exercises.some(e=>e.name.trim().toLowerCase()===n.trim().toLowerCase());
      if(exists) return m;
      return {...m,lastEdited:now,exercises:[...m.exercises,{id:uid(),name:n,sessions:[],lastEdited:now}]};
    }));
  };
  const delEx      = (mId,eId) => setMuscles(ms=>ms.map(m=>m.id===mId?{...m,exercises:m.exercises.filter(e=>e.id!==eId)}:m));
  const renameEx   = (mId,eId,name) => setMuscles(ms=>ms.map(m=>m.id===mId?{...m,exercises:m.exercises.map(e=>e.id===eId?{...e,name}:e)}:m));
  const addSession = (mId,eId,date)=>{
    const s={id:uid(),date,note:"",sets:[]}; const now=Date.now();
    setMuscles(ms=>ms.map(m=>m.id===mId?{...m,lastEdited:now,exercises:m.exercises.map(e=>e.id===eId?{...e,lastEdited:now,sessions:[...e.sessions,s]}:e)}:m));
    return s.id;
  };
  const delSession = (mId,eId,sid) => setMuscles(ms=>ms.map(m=>m.id===mId?{...m,exercises:m.exercises.map(e=>e.id===eId?{...e,sessions:e.sessions.filter(s=>s.id!==sid)}:e)}:m));
  const addSet     = (mId,eId,sid,setData_)=>{
    const set={id:uid(), type:"normal", weight:null, reps:0, note:"", dropSets:[], superSets:[], ...setData_};
    const now=Date.now();
    setMuscles(ms=>ms.map(m=>m.id===mId?{...m,lastEdited:now,exercises:m.exercises.map(e=>e.id===eId?{...e,lastEdited:now,sessions:e.sessions.map(s=>s.id===sid?{...s,sets:[...s.sets,set]}:s)}:e)}:m));
  };
  const delSet     = (mId,eId,sid,setId) => setMuscles(ms=>ms.map(m=>m.id===mId?{...m,exercises:m.exercises.map(e=>e.id===eId?{...e,sessions:e.sessions.map(s=>s.id===sid?{...s,sets:s.sets.filter(t=>t.id!==setId)}:s)}:e)}:m));
  const updateSet  = (mId,eId,sid,setId,patch) => setMuscles(ms=>ms.map(m=>m.id===mId?{...m,exercises:m.exercises.map(e=>e.id===eId?{...e,sessions:e.sessions.map(s=>s.id===sid?{...s,sets:s.sets.map(t=>t.id===setId?{...t,...patch}:t)}:s)}:e)}:m));
  const reorderSets= (mId,eId,sid,newSets) => setMuscles(ms=>ms.map(m=>m.id===mId?{...m,exercises:m.exercises.map(e=>e.id===eId?{...e,sessions:e.sessions.map(s=>s.id===sid?{...s,sets:newSets}:s)}:e)}:m));
  const reorderDaySessions = (orderedSessions) => {
    setMuscles(ms=>{
      const newMs=[...ms.map(m=>({...m,exercises:m.exercises.map(e=>({...e,sessions:[...e.sessions]}))}))];
      orderedSessions.forEach((s,i)=>{
        const m=newMs.find(m=>m.id===s.mId);
        if(!m) return;
        const ex=m.exercises.find(e=>e.id===s.eId);
        if(!ex) return;
        const si=ex.sessions.findIndex(ss=>ss.id===s.id);
        if(si!==-1) ex.sessions[si]={...ex.sessions[si],dayOrder:i};
      });
      return newMs;
    });
  };
  const updateNote = (mId,eId,sid,note) => setMuscles(ms=>ms.map(m=>m.id===mId?{...m,exercises:m.exercises.map(e=>e.id===eId?{...e,sessions:e.sessions.map(s=>s.id===sid?{...s,note}:s)}:e)}:m));

  // ── Daily body weight (per user, per date) ───────────────
  const dailyWeights = activeUser?.dailyWeights || {};
  const setDayWeight = (date, kg) => setData(d=>({...d,users:d.users.map(u=>u.id===activeUser.id
    ? {...u, dailyWeights:{...(u.dailyWeights||{}), [date]: kg==null?undefined:kg}}
    : u
  )}));
  const dailySteps = activeUser?.dailySteps || {};
  const setDaySteps = (date, steps) => setData(d=>({...d,users:d.users.map(u=>u.id===activeUser.id
    ? {...u, dailySteps:{...(u.dailySteps||{}), [date]: steps==null?undefined:steps}}
    : u
  )}));

  // ── Week stats + streak ─────────────────────────────────
  const todayStr = new Date().toISOString().slice(0,10);
  const allSess  = getAllSessions(muscles);
  const weekStart= (()=>{ const d=new Date(); d.setDate(d.getDate()-d.getDay()); return d.toISOString().slice(0,10); })();
  const weekExSessions = allSess.filter(s=>s.date>=weekStart&&s.date<=todayStr);
  const weekSessions = new Set(weekExSessions.map(s=>s.date)).size; // unique training days
  const weekTotalEx = weekExSessions.length; // total exercises across all days
  const streak = (()=>{
    const days=[...new Set(allSess.map(s=>s.date))].sort().reverse();
    if(!days.length) return 0;
    let count=0; let cur=new Date(todayStr);
    for(const d of days){
      let diff=Math.round((cur-new Date(d))/(1000*60*60*24));
      // Skip Sundays: if the gap is exactly 2 and the skipped day is a Sunday, treat as 1
      if(diff===2){
        const skipped=new Date(cur); skipped.setDate(skipped.getDate()-1);
        if(skipped.getDay()===0) diff=1; // Sunday in the gap — forgive it
      }
      if(diff>1) break;
      if(diff===0||diff===1){ count++; cur=new Date(d); }
    }
    return count;
  })();

  // ── Design tokens ────────────────────────────────────────
  const C={green:"#c8f72c",bg:"#0a0a0a",card:"#111",border:"#1a1a1a",text:"#e8e8e8",muted:"#484848",dim:"#2a2a2a",red:"#e8341a"};
  const T={fontFamily:"'DM Mono','Courier New',monospace"};
  const hdr={background:"#0f0f0f",borderBottom:`1px solid ${C.border}`,padding:"44px 18px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:20};
  const ttl={fontSize:15,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:C.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"};
  const sub={fontSize:10,color:"#3a3a3a",letterSpacing:2,textTransform:"uppercase",marginTop:5};
  const bkBtn={background:"none",border:"1px solid #2a2a2a",color:"#777",borderRadius:6,padding:"10px 14px",cursor:"pointer",fontSize:12,...T,letterSpacing:1,flexShrink:0};
  const mnBtn={background:"none",border:"1px solid #2a2a2a",color:"#888",borderRadius:6,padding:"10px 14px",cursor:"pointer",fontSize:17,...T,flexShrink:0,lineHeight:1};
  const crd={background:C.card,border:`1px solid ${C.border}`,borderRadius:10,margin:"8px 14px",padding:"14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"};
  const dBtn={background:"none",border:"none",color:"#252525",cursor:"pointer",fontSize:18,padding:"6px 10px",borderRadius:4,lineHeight:1,flexShrink:0};
  const sRow={background:C.card,border:"1px solid #171717",borderRadius:8,padding:"12px 14px",margin:"5px 14px",display:"flex",alignItems:"center",gap:8};
  const inp={width:"100%",background:C.bg,border:"1px solid #1e1e1e",borderRadius:8,color:C.text,padding:"13px",fontSize:14,...T,marginBottom:10,outline:"none",boxSizing:"border-box"};
  const rw={display:"flex",gap:8};
  const btn=(a,d)=>({flex:1,padding:"14px",borderRadius:8,border:"none",background:d?"#280000":a?C.green:"#181818",color:d?"#ff4444":a?"#000":"#666",...T,fontSize:12,fontWeight:700,letterSpacing:1,cursor:"pointer",textTransform:"uppercase"});
  const mpt={textAlign:"center",padding:"60px 20px",color:"#1e1e1e",fontSize:11,letterSpacing:2,textTransform:"uppercase",lineHeight:2.4};
  const sLbl={fontSize:10,letterSpacing:3,color:"#2a2a2a",textTransform:"uppercase",padding:"18px 14px 8px"};
  const nBox={background:"#0b1400",border:"1px solid #161e00",borderRadius:8,padding:"10px 13px",fontSize:12,color:"#476016",fontStyle:"italic",cursor:"pointer",lineHeight:1.5};

  // ── Floating action button — scroll-aware ────────────────
  // Appears at bottom-center, disappears on scroll down, reappears on scroll up
  function FloatBtn({label, onClick, visible, right=false, left=false}){
    const base={
      position:"fixed", bottom:34, zIndex:15,
      background:C.green, border:"none", color:"#000",
      borderRadius:28, padding:"16px 28px",
      fontSize:15, fontWeight:700, letterSpacing:1,...T,
      cursor:"pointer", boxShadow:"0 4px 24px rgba(200,247,44,0.3)",
      transition:"opacity 0.25s, transform 0.25s",
      opacity: visible?1:0,
      transform: visible?"translateY(0)":"translateY(20px)",
      pointerEvents: visible?"auto":"none",
      textTransform:"uppercase",
      whiteSpace:"nowrap",
    };
    if(left)  base.left="14px";
    else if(right) base.right="14px";
    else { base.left="50%"; base.transform=(visible?"translateX(-50%)":"translateX(-50%) translateY(20px)"); }
    return <button style={base} onClick={onClick}>{label}</button>;
  }

  // ── Modal wrapper ────────────────────────────────────────
  const Wrap=({children})=>(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200}}
      onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null);}}>
      <div style={{background:"#111",border:"1px solid #222",borderRadius:"16px 16px 0 0",padding:"24px 18px 36px",width:"100%",maxWidth:500,...T}}
        onMouseDown={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
  const mTtl={fontSize:11,letterSpacing:3,color:"#444",textTransform:"uppercase",marginBottom:16};

  function NameModal({title,ph,onAdd,checkDupe}){
    const [v,sv]=useState("");
    const dupe = checkDupe&&v.trim()&&checkDupe(v.trim());
    const doAdd=()=>{ if(v.trim()&&!dupe){ onAdd(v.trim()); setModal(null); } };
    return <Wrap>
      <div style={mTtl}>{title}</div>
      <input style={{...inp,borderColor:dupe?"#883300":"#1e1e1e"}} placeholder={ph} value={v} autoFocus
        onChange={e=>sv(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter") doAdd();}}/>
      {dupe&&<div style={{fontSize:11,color:"#883300",marginBottom:10,marginTop:-6}}>Already exists — won't be added again</div>}
      <div style={rw}>
        <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
        <button style={btn(true,!!dupe)} onMouseDown={e=>{e.stopPropagation();doAdd();}}>Add</button>
      </div>
    </Wrap>;
  }

  function EditExModal({mId,eId,current}){
    const [v,sv]=useState(current);
    const doSave=()=>{ if(v.trim()&&v.trim()!==current){ renameEx(mId,eId,v.trim()); } setModal(null); };
    return <Wrap>
      <div style={mTtl}>Rename Exercise</div>
      <input style={inp} value={v} autoFocus
        onChange={e=>sv(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter") doSave();}}/>
      <div style={rw}>
        <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
        <button style={btn(true)} onMouseDown={e=>{e.preventDefault();e.stopPropagation();doSave();}}>Save</button>
      </div>
    </Wrap>;
  }

  // Weight is now optional
  function SetModal({mId,eId,sid}){
    const [type,setType]=useState("normal"); // "normal"|"drop"|"super"
    const [w,sw]=useState("");
    const [r,sr]=useState("");
    const [n,sn]=useState("");
    // Drop set rows
    const [drops,setDrops]=useState([{id:uid(),w:"",r:""}]);
    // Super set: selected exercises + their w/r
    const allEx=muscles.flatMap(m=>m.exercises.map(e=>({...e,mId:m.id,mName:m.name})));
    const [superEx,setSuperEx]=useState([]); // [{eId,mId,mName,name,w,r}]
    const [exSearch,setExSearch]=useState("");

    const canLog = type==="normal"?!!r
      : type==="drop"?!!r
      : superEx.length>0&&superEx.every(e=>e.r);

    const doLog=()=>{
      if(!canLog) return;
      if(type==="normal"){
        addSet(mId,eId,sid,{weight:w?parseFloat(w):null,reps:parseInt(r),note:n,type:"normal",dropSets:[],superSets:[]});
      } else if(type==="drop"){
        addSet(mId,eId,sid,{weight:w?parseFloat(w):null,reps:parseInt(r),note:n,type:"drop",
          dropSets:drops.filter(d=>d.r).map(d=>({id:d.id,weight:d.w?parseFloat(d.w):null,reps:parseInt(d.r)})),
          superSets:[]});
      } else {
        addSet(mId,eId,sid,{weight:null,reps:0,note:n,type:"super",dropSets:[],
          superSets:superEx.map(e=>({eId:e.eId,mId:e.mId,name:e.name,weight:e.w?parseFloat(e.w):null,reps:parseInt(e.r)}))});
      }
      setModal(null);
    };

    const tabStyle=(t)=>({
      flex:1,padding:"10px 4px",border:"none",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700,
      letterSpacing:1,textTransform:"uppercase",...T,
      background:type===t?C.green:"#181818",color:type===t?"#000":"#555",
    });

    const filteredEx=allEx.filter(e=>
      e.name.toLowerCase().includes(exSearch.toLowerCase()) &&
      !superEx.find(s=>s.eId===e.id)
    );

    return <Wrap>
      <div style={mTtl}>Log Set</div>

      {/* Type tabs */}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        <button style={tabStyle("normal")} onMouseDown={e=>{e.stopPropagation();setType("normal");}}>Normal</button>
        <button style={tabStyle("drop")}   onMouseDown={e=>{e.stopPropagation();setType("drop");}}>Drop Set</button>
        <button style={tabStyle("super")}  onMouseDown={e=>{e.stopPropagation();setType("super");}}>Super Set</button>
      </div>

      {/* NORMAL */}
      {type==="normal"&&<>
        <div style={rw}>
          <input style={{...inp,flex:1}} type="number" placeholder="Weight kg (opt)" value={w} autoFocus onChange={e=>sw(e.target.value)}/>
          <input style={{...inp,flex:1}} type="number" placeholder="Reps *" value={r} onChange={e=>sr(e.target.value)}/>
        </div>
        <input style={inp} placeholder="Note (optional)" value={n} onChange={e=>sn(e.target.value)}/>
      </>}

      {/* DROP SET */}
      {type==="drop"&&<>
        <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Main Set</div>
        <div style={rw}>
          <input style={{...inp,flex:1}} type="number" placeholder="Weight kg (opt)" value={w} autoFocus onChange={e=>sw(e.target.value)}/>
          <input style={{...inp,flex:1}} type="number" placeholder="Reps *" value={r} onChange={e=>sr(e.target.value)}/>
        </div>
        <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Drop Sets</div>
        {drops.map((d,i)=>(
          <div key={d.id} style={{...rw,alignItems:"center",marginBottom:2}}>
            <span style={{fontSize:10,color:C.dim,width:20,flexShrink:0}}>D{i+1}</span>
            <input style={{...inp,flex:1,marginBottom:0}} type="number" placeholder="Weight (opt)" value={d.w}
              onChange={e=>setDrops(ds=>ds.map((x,j)=>j===i?{...x,w:e.target.value}:x))}/>
            <input style={{...inp,flex:1,marginBottom:0,marginLeft:6}} type="number" placeholder="Reps *" value={d.r}
              onChange={e=>setDrops(ds=>ds.map((x,j)=>j===i?{...x,r:e.target.value}:x))}/>
            {drops.length>1&&<button style={{...dBtn,color:"#444"}}
              onMouseDown={e=>{e.stopPropagation();setDrops(ds=>ds.filter((_,j)=>j!==i));}}>✕</button>}
          </div>
        ))}
        <button style={{...btn(false),marginTop:6,marginBottom:10,fontSize:11}}
          onMouseDown={e=>{e.stopPropagation();setDrops(ds=>([...ds,{id:uid(),w:"",r:""}]));}}>+ Add Drop</button>
        <input style={inp} placeholder="Note (optional)" value={n} onChange={e=>sn(e.target.value)}/>
      </>}

      {/* SUPER SET */}
      {type==="super"&&<>
        <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Selected Exercises</div>
        {superEx.length===0&&<div style={{fontSize:12,color:"#333",marginBottom:10,textAlign:"center",padding:"10px"}}>Search and add exercises below</div>}
        {superEx.map((e,i)=>(
          <div key={e.eId} style={{background:"#0d0d0d",border:"1px solid #1e1e1e",borderRadius:8,padding:"10px 12px",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",marginBottom:6}}>
              <span style={{flex:1,fontSize:12,color:"#ccc",fontWeight:600}}>{e.name}</span>
              <button style={{...dBtn,fontSize:14,color:"#333",padding:"2px 6px"}}
                onMouseDown={ev=>{ev.stopPropagation();setSuperEx(s=>s.filter((_,j)=>j!==i));}}>✕</button>
            </div>
            <div style={rw}>
              <input style={{...inp,flex:1,marginBottom:0,padding:"9px"}} type="number" placeholder="Weight (opt)" value={e.w||""}
                onChange={ev=>setSuperEx(s=>s.map((x,j)=>j===i?{...x,w:ev.target.value}:x))}/>
              <input style={{...inp,flex:1,marginBottom:0,padding:"9px",marginLeft:6}} type="number" placeholder="Reps *" value={e.r||""}
                onChange={ev=>setSuperEx(s=>s.map((x,j)=>j===i?{...x,r:ev.target.value}:x))}/>
            </div>
          </div>
        ))}
        <div style={{position:"relative",marginBottom:4}}>
          <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#3a3a3a",pointerEvents:"none"}}>⌕</span>
          <input style={{...inp,marginBottom:4,paddingLeft:36}} placeholder="Search exercises to add…"
            value={exSearch} onChange={e=>setExSearch(e.target.value)}/>
        </div>
        {exSearch&&<div style={{maxHeight:160,overflowY:"auto",border:"1px solid #1e1e1e",borderRadius:8,marginBottom:10}}>
          {filteredEx.slice(0,8).map(e=>(
            <div key={e.id} style={{padding:"10px 14px",borderBottom:"1px solid #111",cursor:"pointer",fontSize:13,color:"#888"}}
              onMouseDown={ev=>{ev.stopPropagation();setSuperEx(s=>[...s,{eId:e.id,mId:e.mId,name:e.name,mName:e.mName,w:"",r:""}]);setExSearch("");}}>
              {e.name} <span style={{fontSize:10,color:"#333"}}>· {e.mName}</span>
            </div>
          ))}
          {filteredEx.length===0&&<div style={{padding:"10px 14px",fontSize:12,color:"#333"}}>No matches</div>}
        </div>}
        <input style={inp} placeholder="Note (optional)" value={n} onChange={e=>sn(e.target.value)}/>
      </>}

      <div style={rw}>
        <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
        <button style={btn(true,!canLog)} onMouseDown={e=>{e.stopPropagation();doLog();}}>Log Set</button>
      </div>
    </Wrap>;
  }

  // Shared exercise search widget for super set add
  function SuperExSearch({superRows,setSuperRows}){
    const [q,setQ]=useState("");
    const allEx=muscles.flatMap(m=>m.exercises.map(e=>({...e,mId:m.id,mName:m.name})));
    const filtered=allEx.filter(e=>
      e.name.toLowerCase().includes(q.toLowerCase())&&
      !superRows.find(s=>s.eId===e.id)
    );
    return(
      <div style={{marginBottom:6}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#3a3a3a",pointerEvents:"none"}}>⌕</span>
          <input style={{...inp,paddingLeft:36,marginBottom:4}} placeholder="Add exercise to super set…"
            value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        {q&&<div style={{maxHeight:150,overflowY:"auto",border:"1px solid #1e1e1e",borderRadius:8,marginBottom:8}}>
          {filtered.slice(0,8).map(e=>(
            <div key={e.id} style={{padding:"10px 14px",borderBottom:"1px solid #111",cursor:"pointer",fontSize:13,color:"#888"}}
              onMouseDown={ev=>{ev.stopPropagation();setSuperRows(s=>[...s,{eId:e.id,mId:e.mId,name:e.name,mName:e.mName,w:"",r:""}]);setQ("");}}>
              {e.name}<span style={{fontSize:10,color:"#333"}}> · {e.mName}</span>
            </div>
          ))}
          {filtered.length===0&&<div style={{padding:"10px 14px",fontSize:12,color:"#333"}}>No matches</div>}
        </div>}
      </div>
    );
  }

  // Edit existing set
  function EditSetModal({mId,eId,sid,set}){
    const [w,sw]=useState(set.weight!=null?String(set.weight):"");
    const [r,sr]=useState(set.reps?String(set.reps):"");
    const [n,sn]=useState(set.note||"");
    const [drops,setDrops]=useState(
      set.dropSets?.length?set.dropSets.map(d=>({...d,w:d.weight!=null?String(d.weight):"",r:String(d.reps)}))
      :[{id:uid(),w:"",r:""}]
    );
    const type=set.type||"normal";
    const [superRows,setSuperRows]=useState(
      set.superSets?.length?set.superSets.map(ss=>({...ss,w:ss.weight!=null?String(ss.weight):"",r:ss.reps?String(ss.reps):""})):[]
    );
    const canSave=type==="normal"?!!r : type==="drop"?!!r : superRows.every(e=>e.r);
    const doSave=()=>{
      if(!canSave) return;
      const patch={note:n};
      if(type==="normal"||type==="drop"){
        patch.weight=w?parseFloat(w):null;
        patch.reps=parseInt(r)||0;
      }
      if(type==="drop") patch.dropSets=drops.filter(d=>d.r).map(d=>({id:d.id,weight:d.w?parseFloat(d.w):null,reps:parseInt(d.r)}));
      if(type==="super") patch.superSets=superRows.map(e=>({eId:e.eId,mId:e.mId,name:e.name,weight:e.w?parseFloat(e.w):null,reps:parseInt(e.r)||0}));
      updateSet(mId,eId,sid,set.id,patch);
      setModal(null);
    };
    return <Wrap>
      <div style={mTtl}>Edit Set {type!=="normal"&&<span style={{color:C.green,fontSize:10}}>({type})</span>}</div>
      {(type==="normal"||type==="drop")&&<>
        <div style={rw}>
          <input style={{...inp,flex:1}} type="number" placeholder="Weight kg (opt)" value={w} autoFocus onChange={e=>sw(e.target.value)}/>
          <input style={{...inp,flex:1}} type="number" placeholder="Reps *" value={r} onChange={e=>sr(e.target.value)}/>
        </div>
      </>}
      {type==="drop"&&<>
        <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Drop Sets</div>
        {drops.map((d,i)=>(
          <div key={d.id} style={{...rw,alignItems:"center",marginBottom:2}}>
            <span style={{fontSize:10,color:C.dim,width:20,flexShrink:0}}>D{i+1}</span>
            <input style={{...inp,flex:1,marginBottom:0}} type="number" placeholder="Weight (opt)" value={d.w}
              onChange={e=>setDrops(ds=>ds.map((x,j)=>j===i?{...x,w:e.target.value}:x))}/>
            <input style={{...inp,flex:1,marginBottom:0,marginLeft:6}} type="number" placeholder="Reps *" value={d.r}
              onChange={e=>setDrops(ds=>ds.map((x,j)=>j===i?{...x,r:e.target.value}:x))}/>
            {drops.length>1&&<button style={{...dBtn,color:"#444"}} onMouseDown={e=>{e.stopPropagation();setDrops(ds=>ds.filter((_,j)=>j!==i));}}>✕</button>}
          </div>
        ))}
        <button style={{...btn(false),marginTop:6,marginBottom:10,fontSize:11}}
          onMouseDown={e=>{e.stopPropagation();setDrops(ds=>([...ds,{id:uid(),w:"",r:""}]));}}>+ Add Drop</button>
      </>}
      {type==="super"&&<>
        <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Super Set Exercises</div>
        {superRows.map((e,i)=>(
          <div key={e.eId||i} style={{background:"#0d0d0d",border:"1px solid #1e1e1e",borderRadius:8,padding:"10px 12px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",marginBottom:8}}>
              <span style={{flex:1,fontSize:12,color:"#aaa",fontWeight:600}}>{e.name}</span>
              <button style={{...dBtn,fontSize:14,color:"#333",padding:"2px 6px"}}
                onMouseDown={ev=>{ev.stopPropagation();setSuperRows(s=>s.filter((_,j)=>j!==i));}}>✕</button>
            </div>
            <div style={rw}>
              <input style={{...inp,flex:1,marginBottom:0,padding:"9px"}} type="number" placeholder="Weight (opt)" value={e.w}
                onChange={ev=>setSuperRows(s=>s.map((x,j)=>j===i?{...x,w:ev.target.value}:x))}/>
              <input style={{...inp,flex:1,marginBottom:0,padding:"9px",marginLeft:6}} type="number" placeholder="Reps *" value={e.r}
                onChange={ev=>setSuperRows(s=>s.map((x,j)=>j===i?{...x,r:ev.target.value}:x))}/>
            </div>
          </div>
        ))}
        {/* Add exercise to super set */}
        <SuperExSearch superRows={superRows} setSuperRows={setSuperRows}/>
      </>}
      <input style={{...inp,marginTop:type==="super"?8:0}} placeholder="Note (optional)" value={n} onChange={e=>sn(e.target.value)}/>
      <div style={rw}>
        <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
        <button style={btn(true,!canSave)} onMouseDown={e=>{e.stopPropagation();doSave();}}>Save</button>
      </div>
    </Wrap>;
  }

  function ConfirmModal({msg,onOk}){
    return <Wrap>
      <div style={{...mTtl,marginBottom:10}}>Confirm Delete</div>
      <div style={{color:"#555",fontSize:13,marginBottom:22,lineHeight:1.7}}>{msg}</div>
      <div style={rw}>
        <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
        <button style={btn(false,true)} onMouseDown={e=>{e.stopPropagation();onOk();setModal(null);}}>Delete</button>
      </div>
    </Wrap>;
  }

  function DayWeightModal({date}){
    const existing = dailyWeights[date];
    const [val,setVal] = useState(existing!=null?String(existing):"");
    const doSave = () => {
      const kg = parseFloat(val);
      if(!isNaN(kg)&&kg>0){ setDayWeight(date,kg); }
      setModal(null);
    };
    const doClear = () => { setDayWeight(date,null); setModal(null); };
    return <Wrap>
      <div style={mTtl}>{existing!=null?"Edit Body Weight":"Log Body Weight"}</div>
      <div style={{fontSize:11,color:"#444",letterSpacing:1,marginBottom:12}}>{fmtDate(date)}</div>
      <div style={{position:"relative",marginBottom:14}}>
        <input type="number" autoFocus
          style={{...inp,marginBottom:0,paddingRight:44,fontSize:22,textAlign:"center",color:C.green,fontWeight:700}}
          placeholder="0.0" value={val}
          onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") doSave(); }}/>
        <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#555",...T}}>kg</span>
      </div>
      <div style={rw}>
        {existing!=null&&<button style={{...btn(false,true),flex:"0 0 auto",padding:"14px 18px",fontSize:11}} onMouseDown={e=>{e.stopPropagation();doClear();}}>Clear</button>}
        <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
        <button style={btn(true,!val)} onMouseDown={e=>{e.stopPropagation();doSave();}}>Save</button>
      </div>
    </Wrap>;
  }

  function DayStepsModal({date}){
    const existing = dailySteps[date];
    const [val,setVal] = useState(existing!=null?String(existing):"");
    const doSave = () => {
      const s = parseInt(val);
      if(!isNaN(s)&&s>=0){ setDaySteps(date,s); }
      setModal(null);
    };
    const doClear = () => { setDaySteps(date,null); setModal(null); };
    return <Wrap>
      <div style={mTtl}>{existing!=null?"Edit Steps":"Log Steps"}</div>
      <div style={{fontSize:11,color:"#444",letterSpacing:1,marginBottom:12}}>{fmtDate(date)}</div>
      <div style={{position:"relative",marginBottom:14}}>
        <input type="number" autoFocus
          style={{...inp,marginBottom:0,paddingRight:56,fontSize:22,textAlign:"center",color:"#5bc8f5",fontWeight:700}}
          placeholder="0" value={val}
          onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") doSave(); }}/>
        <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#555",...T}}>steps</span>
      </div>
      <div style={rw}>
        {existing!=null&&<button style={{...btn(false,true),flex:"0 0 auto",padding:"14px 18px",fontSize:11}} onMouseDown={e=>{e.stopPropagation();doClear();}}>Clear</button>}
        <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
        <button style={{...btn(true,!val),background:val?"#003a4a":"",color:val?"#5bc8f5":""}} onMouseDown={e=>{e.stopPropagation();doSave();}}>Save</button>
      </div>
    </Wrap>;
  }

  // ── Set list with long-press drag-to-reorder ─────────────
  function SetList({sets,mId,eId,sid}){
    const [localSets,setLocalSets]=useState(sets);
    const [dragging,setDragging]=useState(null);
    const [dragOver,setDragOver]=useState(null);
    const longPressTimer=useRef(null);
    const rowRefs=useRef([]);
    const dragState=useRef({active:false,idx:null});

    useEffect(()=>setLocalSets(sets),[sets]);

    if(!localSets.length) return <div style={mpt}>Tap + Log Set to add your first set</div>;

    const startLongPress=(i,e)=>{
      e.stopPropagation();
      longPressTimer.current=setTimeout(()=>{
        dragState.current={active:true,idx:i};
        setDragging(i);
        if(navigator.vibrate) navigator.vibrate(40);
      },350);
    };
    const cancelLongPress=()=>{
      clearTimeout(longPressTimer.current);
    };

    const onTouchMove=(e)=>{
      if(!dragState.current.active) return;
      e.preventDefault();
      const y=e.touches[0].clientY;
      let over=null;
      rowRefs.current.forEach((ref,i)=>{
        if(!ref) return;
        const rect=ref.getBoundingClientRect();
        if(y>=rect.top&&y<=rect.bottom) over=i;
      });
      if(over!==null&&over!==dragState.current.idx) setDragOver(over);
    };
    const onTouchEnd=()=>{
      clearTimeout(longPressTimer.current);
      if(dragState.current.active){
        const from=dragState.current.idx;
        const to=dragOver;
        if(from!==null&&to!==null&&from!==to){
          const arr=[...localSets];
          const [moved]=arr.splice(from,1);
          arr.splice(to,0,moved);
          setLocalSets(arr);
          reorderSets(mId,eId,sid,arr);
        }
      }
      dragState.current={active:false,idx:null};
      setDragging(null);
      setDragOver(null);
    };

    return(
      <div onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        {localSets.map((s,i)=>{
          const type=s.type||"normal";
          const isDragging=dragging===i;
          const isOver=dragOver===i&&dragging!==null&&dragging!==i;
          const typeTag=type!=="normal"
            ?<span style={{fontSize:9,background:type==="drop"?"#2a1500":"#001a2a",color:type==="drop"?"#ff8800":"#00aaff",borderRadius:4,padding:"1px 6px",letterSpacing:1,textTransform:"uppercase",marginLeft:6}}>{type}</span>
            :null;
          return(
            <div key={s.id} ref={el=>rowRefs.current[i]=el}
              style={{...sRow,flexDirection:"column",alignItems:"stretch",
                opacity:isDragging?0.35:1,
                borderColor:isOver?C.green:"#171717",
                transform:isOver?"translateY(-2px)":"translateY(0)",
                transition:"opacity 0.15s,border-color 0.1s,transform 0.1s",
              }}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span
                  style={{fontSize:16,color:isDragging?"#c8f72c":"#383838",padding:"6px 8px",flexShrink:0,cursor:"grab",userSelect:"none"}}
                  onTouchStart={e=>startLongPress(i,e)}
                  onTouchEnd={cancelLongPress}
                  onMouseDown={e=>e.stopPropagation()}>⠿</span>
                <span style={{fontSize:10,color:C.dim,letterSpacing:2,width:22,flexShrink:0}}>S{i+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:4,flexWrap:"wrap"}}>
                    {type==="super"
                      ?<span style={{fontSize:12,color:"#ccc",fontWeight:600}}>Super Set · {s.superSets?.length||0} exercises</span>
                      :<>
                        {s.weight!=null&&<><span style={{fontWeight:700,fontSize:17,color:C.green}}>{s.weight}</span><span style={{fontSize:10,color:C.dim}}>kg ×</span></>}
                        <span style={{fontWeight:700,fontSize:17,color:C.green}}>{s.reps}</span>
                        <span style={{fontSize:10,color:C.dim}}>reps</span>
                      </>
                    }
                    {typeTag}
                  </div>
                  {s.note&&<div style={{fontSize:11,color:"#385016",marginTop:2,fontStyle:"italic"}}>"{s.note}"</div>}
                </div>
                {type!=="super"&&s.weight!=null&&<span style={{fontSize:11,color:"#243810",flexShrink:0}}>{Math.round(s.weight*s.reps)}kg</span>}
                <button
                  style={{background:"#0d1400",border:"1px solid #1e3000",color:"#6a9a00",
                    borderRadius:6,padding:"4px 9px",fontSize:11,fontWeight:700,cursor:"pointer",
                    flexShrink:0,lineHeight:1,...T,letterSpacing:0.5}}
                  onMouseDown={e=>e.stopPropagation()}
                  title="Duplicate set"
                  onClick={()=>addSet(mId,eId,sid,{weight:s.weight,reps:s.reps,type:s.type||"normal",note:s.note||"",dropSets:s.dropSets||[],superSets:s.superSets||[]})}
                  onMouseEnter={e=>{e.currentTarget.style.background="#141e00";e.currentTarget.style.color=C.green;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#0d1400";e.currentTarget.style.color="#6a9a00";}}>⎘</button>
                <button style={{...dBtn,fontSize:14,color:"#2a2a2a",padding:"4px 8px"}}
                  onMouseDown={e=>e.stopPropagation()}
                  onClick={()=>setModal({type:"editSet",mId,eId,sid,set:s})}
                  onMouseEnter={e=>e.currentTarget.style.color="#c8f72c"}
                  onMouseLeave={e=>e.currentTarget.style.color="#2a2a2a"}>✎</button>
                <button style={{...dBtn,fontSize:16,padding:"4px 6px"}}
                  onMouseDown={e=>e.stopPropagation()}
                  onClick={()=>setModal({type:"confirm",msg:`Delete set ${i+1}?`,onOk:()=>delSet(mId,eId,sid,s.id)})}
                  onMouseEnter={e=>e.currentTarget.style.color="#cc2222"}
                  onMouseLeave={e=>e.currentTarget.style.color="#252525"}>✕</button>
              </div>
              {type==="drop"&&s.dropSets?.length>0&&(
                <div style={{marginTop:8,paddingLeft:34}}>
                  {s.dropSets.map((d,di)=>(
                    <div key={d.id||di} style={{display:"flex",alignItems:"baseline",gap:4,marginTop:4}}>
                      <span style={{fontSize:9,color:"#333",width:18,flexShrink:0}}>D{di+1}</span>
                      {d.weight!=null&&<><span style={{fontSize:14,fontWeight:600,color:"#ff8800"}}>{d.weight}</span><span style={{fontSize:10,color:C.dim}}>kg ×</span></>}
                      <span style={{fontSize:14,fontWeight:600,color:"#ff8800"}}>{d.reps}</span>
                      <span style={{fontSize:10,color:C.dim}}>reps</span>
                    </div>
                  ))}
                </div>
              )}
              {type==="super"&&s.superSets?.length>0&&(
                <div style={{marginTop:8,paddingLeft:34}}>
                  {s.superSets.map((ss,si)=>(
                    <div key={si} style={{display:"flex",alignItems:"baseline",gap:4,marginTop:4,flexWrap:"wrap"}}>
                      <span style={{fontSize:10,color:"#555",marginRight:4}}>{ss.name}</span>
                      {ss.weight!=null&&<><span style={{fontSize:14,fontWeight:600,color:"#00aaff"}}>{ss.weight}</span><span style={{fontSize:10,color:C.dim}}>kg ×</span></>}
                      <span style={{fontSize:14,fontWeight:600,color:"#00aaff"}}>{ss.reps}</span>
                      <span style={{fontSize:10,color:C.dim}}>reps</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Stats bar ────────────────────────────────────────────
  function StatsBar({sets}){
    const normalSets=sets.filter(s=>s.weight!=null&&s.type!=="super");
    const vol=normalSets.reduce((a,s)=>a+s.weight*s.reps,0);
    const max=normalSets.length?Math.max(...normalSets.map(s=>s.weight)):null;
    return(
      <div style={{display:"flex",borderBottom:"1px solid #131313",background:"#0d0d0d"}}>
        {[{l:"Sets",v:sets.length},{l:"Volume",v:vol?`${vol}kg`:"—"},{l:"Max",v:max!=null?`${max}kg`:"—"}].map((x,i)=>(
          <div key={x.l} style={{flex:1,padding:"14px 0",textAlign:"center",borderRight:i<2?"1px solid #131313":"none"}}>
            <div style={{fontSize:20,fontWeight:700,color:C.green,...T}}>{x.v}</div>
            <div style={{fontSize:9,color:C.dim,letterSpacing:2,textTransform:"uppercase",marginTop:2}}>{x.l}</div>
          </div>
        ))}
      </div>
    );
  }

  // ── Footer ───────────────────────────────────────────────
  const Footer=()=>(
    <div style={{textAlign:"center",padding:"28px 20px 40px",fontSize:11,color:"#222",letterSpacing:2,...T}}>
      CREATED BY PRASAD
    </div>
  );

  // ── SIDEBAR ───────────────────────────────────────────────
  function Sidebar(){
    const [sbSearch,setSbSearch]=useState("");
    const [renamingUid,setRenamingUid]=useState(null);
    const [renameVal,setRenameVal]=useState("");
    const [usersOpen,setUsersOpen]=useState(false);
    const [exercisesOpen,setExercisesOpen]=useState(true);
    const trimmed=sbSearch.trim().toLowerCase();

    const allExFiltered = trimmed
      ? muscles.flatMap(m=>
          m.exercises.filter(e=>e.name.toLowerCase().includes(trimmed))
            .map(e=>({...e,mId:m.id,mName:m.name}))
        )
      : null;

    const hiText=(name)=>{
      if(!trimmed) return name;
      const idx=name.toLowerCase().indexOf(trimmed);
      if(idx<0) return name;
      return <>{name.slice(0,idx)}<span style={{color:C.green,fontWeight:700}}>{name.slice(idx,idx+sbSearch.length)}</span>{name.slice(idx+sbSearch.length)}</>;
    };

    const SectionHeader=({label,open,onToggle})=>(
      <div style={{display:"flex",alignItems:"center",padding:"12px 18px",cursor:"pointer",
        background:"#0c0c0c",borderBottom:`1px solid #1a1a1a`,userSelect:"none"}}
        onMouseDown={e=>e.stopPropagation()} onClick={onToggle}>
        <span style={{fontSize:10,letterSpacing:3,color:"#555",textTransform:"uppercase",flex:1,fontWeight:700}}>{label}</span>
        <span style={{fontSize:11,color:"#333"}}>{open?"▲":"▼"}</span>
      </div>
    );

    return <>
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:50}}/>
      <div ref={sideRef} style={{position:"fixed",top:0,left:0,bottom:0,width:"82%",maxWidth:340,
        background:"#0f0f0f",borderRight:"1px solid #1e1e1e",zIndex:51,overflowY:"hidden",display:"flex",flexDirection:"column",...T}}
        onTouchStart={e=>{const t=e.touches[0];sideSwipeRef.current={x:t.clientX,y:t.clientY};}}
        onTouchEnd={e=>{const s=sideSwipeRef.current;if(!s)return;const dx=s.x-e.changedTouches[0].clientX;const dy=Math.abs(s.y-e.changedTouches[0].clientY);if(dx>50&&dy<60){setSidebar(false);}sideSwipeRef.current=null;}}>

        <div style={{padding:"44px 18px 14px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:22,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:C.text}}>Menu</div>
          <button style={{background:"none",border:"none",color:"#555",fontSize:26,cursor:"pointer",padding:"2px 10px",lineHeight:1}}
            onClick={()=>setSidebar(false)}>✕</button>
        </div>

        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>

          {/* ── USERS SECTION ── */}
          <div style={{borderBottom:"1px solid #1a1a1a"}}>
            <SectionHeader label="Users" open={usersOpen} onToggle={()=>setUsersOpen(o=>!o)}/>
            {usersOpen&&<>
              {data.users.map(u=>{
                const isActive=u.id===data.activeUserId;
                const totalSessions=u.muscles.flatMap(m=>m.exercises.flatMap(e=>e.sessions)).length;
                return(
                  <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 18px",
                    background:isActive?"#141a00":"transparent",
                    borderLeft:isActive?`3px solid ${C.green}`:"3px solid transparent",
                    cursor:"pointer"}}
                    onMouseDown={e=>e.stopPropagation()}
                    onClick={()=>{if(!isActive){switchUser(u.id);setSidebar(false);}}}>
                    <div style={{width:36,height:36,borderRadius:"50%",
                      background:isActive?C.green:"#1e1e1e",
                      border:`2px solid ${isActive?C.green:"#2a2a2a"}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:14,fontWeight:700,color:isActive?"#000":"#555",flexShrink:0}}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      {renamingUid===u.id
                        ? <input
                            style={{...inp,marginBottom:0,padding:"4px 8px",fontSize:13,width:"100%"}}
                            autoFocus value={renameVal}
                            onChange={e=>setRenameVal(e.target.value)}
                            onBlur={()=>{if(renameVal.trim())renameUser(u.id,renameVal.trim());setRenamingUid(null);}}
                            onKeyDown={e=>{if(e.key==="Enter"){if(renameVal.trim())renameUser(u.id,renameVal.trim());setRenamingUid(null);}if(e.key==="Escape")setRenamingUid(null);}}
                            onClick={e=>e.stopPropagation()}
                          />
                        : <>
                            <div style={{fontSize:14,fontWeight:isActive?700:500,color:isActive?C.green:"#888",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.name}</div>
                            <div style={{fontSize:10,color:"#333",marginTop:1}}>{totalSessions} session{totalSessions!==1?"s":""}</div>
                          </>
                      }
                    </div>
                    <button style={{...dBtn,fontSize:13,color:"#2a2a2a",padding:"4px 6px"}}
                      onMouseDown={ev=>{ev.preventDefault();ev.stopPropagation();setRenamingUid(u.id);setRenameVal(u.name);}}
                      onMouseEnter={ev=>ev.currentTarget.style.color=C.green}
                      onMouseLeave={ev=>ev.currentTarget.style.color="#2a2a2a"}>✎</button>
                    {data.users.length>1&&<button style={{...dBtn,fontSize:14,color:"#2a2a2a",padding:"4px 6px"}}
                      onMouseDown={ev=>{ev.preventDefault();ev.stopPropagation();setModal({type:"confirm",msg:`Delete user "${u.name}" and all their data?`,onOk:()=>delUser(u.id)});}}
                      onMouseEnter={ev=>ev.currentTarget.style.color="#cc2222"}
                      onMouseLeave={ev=>ev.currentTarget.style.color="#2a2a2a"}>✕</button>}
                  </div>
                );
              })}
              <div style={{padding:"10px 18px",fontSize:13,color:"#2a5000",cursor:"pointer",fontWeight:600,borderTop:"1px solid #141414"}}
                onMouseDown={e=>e.stopPropagation()}
                onClick={()=>setModal({type:"addUser"})}>+ Add User</div>
            </>}
          </div>

          {/* ── EXERCISES SECTION ── */}
          <div>
            <SectionHeader label={`Exercises · ${activeUser?.name||""}`} open={exercisesOpen} onToggle={()=>setExercisesOpen(o=>!o)}/>
            {exercisesOpen&&<>
              {/* Search bar */}
              <div style={{padding:"8px 14px",borderBottom:"1px solid #141414"}}
                onMouseDown={e=>e.stopPropagation()}>
                <div style={{position:"relative",display:"flex",alignItems:"center"}}>
                  <span style={{position:"absolute",left:13,fontSize:14,color:"#3a3a3a",pointerEvents:"none"}}>⌕</span>
                  <input
                    style={{...inp,marginBottom:0,paddingLeft:36,background:"#0a0a0a",border:"1px solid #1e1e1e",fontSize:13}}
                    placeholder="Search exercises…"
                    value={sbSearch}
                    onChange={e=>setSbSearch(e.target.value)}
                  />
                  {sbSearch&&<button
                    style={{position:"absolute",right:10,background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:16,padding:"4px",lineHeight:1}}
                    onMouseDown={e=>{e.preventDefault();e.stopPropagation();setSbSearch("");}}>✕</button>}
                </div>
              </div>

              {allExFiltered ? (
                <div>
                  {allExFiltered.length===0&&<div style={{...mpt,fontSize:12}}>No exercises match<br/>"{sbSearch}"</div>}
                  {allExFiltered.map(e=>{
                    const last=sortSess(e.sessions)[0];
                    const maxW=last?.sets.filter(s=>s.weight!=null).length?Math.max(...last.sets.filter(s=>s.weight!=null).map(s=>s.weight)):0;
                    return(
                      <div key={e.id}
                        style={{display:"flex",alignItems:"center",padding:"9px 18px",borderBottom:"1px solid #111"}}
                        onMouseDown={ev=>ev.stopPropagation()}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,color:"#bbb",cursor:"pointer",marginBottom:2}}
                            onMouseDown={ev=>{ev.stopPropagation();setSidebar(false);setViewEx({mId:e.mId,eId:e.id});setScreen("exHistory");}}>
                            {hiText(e.name)}
                          </div>
                          <div style={{fontSize:10,color:"#383838"}}>{e.mName}{maxW>0?` · ${maxW}kg`:""}</div>
                        </div>
                        <button style={{...dBtn,fontSize:13,color:"#2a2a2a",marginRight:2}}
                          onMouseDown={ev=>{ev.preventDefault();ev.stopPropagation();setModal({type:"editEx",mId:e.mId,eId:e.id,current:e.name});}}
                          onMouseEnter={ev=>ev.currentTarget.style.color="#c8f72c"}
                          onMouseLeave={ev=>ev.currentTarget.style.color="#2a2a2a"}>✎</button>
                        <button style={{...dBtn,fontSize:14,color:"#2a2a2a"}}
                          onMouseDown={ev=>{ev.preventDefault();ev.stopPropagation();setModal({type:"confirm",msg:`Delete "${e.name}" and all its sessions?`,onOk:()=>delEx(e.mId,e.id)});}}
                          onMouseEnter={ev=>ev.currentTarget.style.color="#cc2222"}
                          onMouseLeave={ev=>ev.currentTarget.style.color="#2a2a2a"}>✕</button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                muscles.map(m=>(
                  <div key={m.id} style={{borderBottom:"1px solid #141414"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 18px",cursor:"pointer"}}
                      onMouseDown={e=>{e.stopPropagation();setSbOpen(o=>({...o,[m.id]:!o[m.id]}));}}>
                      <MuscleIcon muscle={m.name} size={28}/>
                      <span style={{fontSize:16,fontWeight:700,color:"#ddd",flex:1,letterSpacing:0.5}}>{m.name}</span>
                      <span style={{fontSize:11,color:"#3a3a3a",marginRight:6}}>{m.exercises.length}</span>
                      <span style={{fontSize:11,color:"#3a3a3a"}}>{sbOpen[m.id]?"▲":"▼"}</span>
                    </div>
                    {sbOpen[m.id]&&(
                      <div style={{paddingBottom:4}}>
                        {sortEx(m.exercises).map(e=>{
                          const last=sortSess(e.sessions)[0];
                          const maxW=last?.sets.filter(s=>s.weight!=null).length?Math.max(...last.sets.filter(s=>s.weight!=null).map(s=>s.weight)):0;
                          return(
                            <div key={e.id}
                              style={{display:"flex",alignItems:"center",padding:"8px 18px 8px 58px",borderTop:"1px solid #111"}}
                              onMouseDown={e=>e.stopPropagation()}>
                              <span style={{flex:1,fontSize:12,color:"#888",cursor:"pointer"}}
                                onMouseDown={ev=>{ev.stopPropagation();setSidebar(false);setViewEx({mId:m.id,eId:e.id});setScreen("exHistory");}}>
                                {e.name}
                              </span>
                              {maxW>0&&<span style={{fontSize:10,color:"#2a2a2a",marginRight:8}}>{maxW}kg</span>}
                              <button style={{...dBtn,fontSize:13,color:"#2a2a2a",marginRight:2}}
                                onMouseDown={ev=>{ev.preventDefault();ev.stopPropagation();setModal({type:"editEx",mId:m.id,eId:e.id,current:e.name});}}
                                onMouseEnter={ev=>ev.currentTarget.style.color="#c8f72c"}
                                onMouseLeave={ev=>ev.currentTarget.style.color="#2a2a2a"}>✎</button>
                              <button style={{...dBtn,fontSize:14,color:"#2a2a2a"}}
                                onMouseDown={ev=>{ev.preventDefault();ev.stopPropagation();setModal({type:"confirm",msg:`Delete "${e.name}" and all its sessions?`,onOk:()=>delEx(m.id,e.id)});}}
                                onMouseEnter={ev=>ev.currentTarget.style.color="#cc2222"}
                                onMouseLeave={ev=>ev.currentTarget.style.color="#2a2a2a"}>✕</button>
                            </div>
                          );
                        })}
                        <div style={{padding:"8px 18px 8px 58px",fontSize:12,color:"#2a5000",cursor:"pointer",borderTop:"1px solid #111",fontWeight:600}}
                          onMouseDown={e=>{e.stopPropagation();setModal({type:"addEx",mId:m.id});}}>+ Add exercise</div>
                        <div style={{padding:"8px 18px 8px 58px",fontSize:12,color:"#5a1800",cursor:"pointer",borderTop:"1px solid #111",fontWeight:600}}
                          onMouseDown={e=>{e.stopPropagation();setModal({type:"confirm",msg:`Delete "${m.name}" and all its data?`,onOk:()=>delMuscle(m.id)});}}>− Delete muscle</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>}
          </div>

        </div>

        {/* Fixed bottom area */}
        <div style={{flexShrink:0,borderTop:"1px solid #1a1a1a",background:"#0f0f0f",padding:"12px 18px 8px"}}>
          <button style={{...btn(true),display:"block",width:"100%",fontSize:15,padding:"14px"}}
            onMouseDown={e=>{e.stopPropagation();setModal({type:"addMuscle"});}}>+ Add Muscle Group</button>
        </div>
        <div style={{textAlign:"center",padding:"6px 20px 34px",fontSize:12,color:"#555",letterSpacing:2,...T,flexShrink:0,background:"#0f0f0f"}}>
          CREATED WITH ❤️ BY{" "}
          <a href="https://www.linkedin.com/in/prasadrpatil" target="_blank" rel="noreferrer"
            style={{color:C.green,textDecoration:"none",letterSpacing:2}}
            onMouseDown={e=>e.stopPropagation()}>PRASAD</a>
        </div>
      </div>
    </>;
  }



  // ── BODY WEIGHT MODAL ─────────────────────────────────────
  function BodyWeightModal({onClose}){
    const [selected, setSelected] = useState(null); // {date, kg}
    const svgRef = useRef(null);

    // Build last-30-days data
    const today = new Date();
    const points = [];
    for(let i=29; i>=0; i--){
      const d = new Date(today);
      d.setDate(today.getDate()-i);
      const iso = d.toISOString().slice(0,10);
      const kg = dailyWeights[iso];
      if(kg!=null) points.push({date:iso, kg, idx:29-i});
    }

    // X/Y layout
    const W=320, H=180, PAD={top:16,right:16,bottom:40,left:44};
    const plotW=W-PAD.left-PAD.right;
    const plotH=H-PAD.top-PAD.bottom;

    const kgVals = points.map(p=>p.kg);
    const minKg = kgVals.length ? Math.floor(Math.min(...kgVals)-1) : 50;
    const maxKg = kgVals.length ? Math.ceil(Math.max(...kgVals)+1) : 100;
    const rangeKg = maxKg - minKg || 1;

    function xOf(idx){ return PAD.left + (idx/29)*plotW; }
    function yOf(kg){ return PAD.top + plotH - ((kg-minKg)/rangeKg)*plotH; }

    // Build SVG polyline
    const linePoints = points.map(p=>`${xOf(p.idx)},${yOf(p.kg)}`).join(" ");
    const areaPoints = points.length>=2
      ? `${xOf(points[0].idx)},${PAD.top+plotH} `+linePoints+` ${xOf(points[points.length-1].idx)},${PAD.top+plotH}`
      : "";

    // Y-axis ticks
    const yTicks = [];
    const step = rangeKg<=10?1:rangeKg<=20?2:5;
    for(let v=Math.ceil(minKg/step)*step; v<=maxKg; v+=step){
      yTicks.push(v);
    }

    // X-axis: show ~5 evenly-spaced dates
    const xLabels=[];
    const labelIdxs=[0,7,14,21,29];
    labelIdxs.forEach(i=>{
      const d=new Date(today);
      d.setDate(today.getDate()-(29-i));
      xLabels.push({idx:i, label:d.toLocaleDateString("en-US",{month:"short",day:"numeric"})});
    });

    // Click on SVG → find nearest point
    function handleSvgClick(e){
      if(!svgRef.current||points.length===0) return;
      const rect=svgRef.current.getBoundingClientRect();
      const mx=(e.clientX-rect.left)*(W/rect.width);
      // Find nearest point by x distance
      let best=null, bestDist=Infinity;
      points.forEach(p=>{
        const d=Math.abs(xOf(p.idx)-mx);
        if(d<bestDist){bestDist=d;best=p;}
      });
      if(best&&bestDist<40){
        setSelected(sel=>sel?.date===best.date?null:best);
      } else {
        setSelected(null);
      }
    }

    const shortDate=iso=>new Date(iso).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});

    return(
      <div style={{position:"fixed",inset:0,zIndex:60,background:C.bg,display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{background:"#0f0f0f",borderBottom:"1px solid #1a1a1a",padding:"44px 18px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <button style={{background:"none",border:"1px solid #2a2a2a",color:"#777",borderRadius:6,padding:"10px 14px",cursor:"pointer",fontSize:12,...T,letterSpacing:1,flexShrink:0}}
            onClick={onClose}>← Back</button>
          <div style={{fontSize:16,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:C.text}}>Body Weight</div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"20px 18px 40px"}}>

          {/* Subtitle */}
          <div style={{fontSize:10,color:"#3a3a3a",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>Last 30 days</div>

          {/* Selected point info */}
          {selected?(
            <div style={{background:"#0d1400",border:"1px solid #1e3000",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:28,fontWeight:700,color:C.green,letterSpacing:-1}}>{selected.kg}<span style={{fontSize:12,color:"#4a7a00",fontWeight:400}}> kg</span></div>
              <div>
                <div style={{fontSize:12,color:C.text,fontWeight:600}}>{shortDate(selected.date)}</div>
                <div style={{fontSize:10,color:"#4a6a00",marginTop:2,letterSpacing:1}}>tap again to deselect</div>
              </div>
            </div>
          ):(
            <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:10,padding:"12px 16px",marginBottom:16,
              fontSize:10,color:"#3a3a3a",letterSpacing:1,textTransform:"uppercase",textAlign:"center"}}>
              {points.length>0?"Tap graph to inspect a point":"No data yet — log weight from any day's view"}
            </div>
          )}

          {/* Graph */}
          {points.length>0?(
            <div style={{background:"#0c0c0c",border:"1px solid #1a1a1a",borderRadius:12,overflow:"hidden",padding:"8px 0 4px"}}>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                width="100%"
                style={{display:"block",cursor:"crosshair",touchAction:"none"}}
                onClick={handleSvgClick}
              >
                {/* Grid lines */}
                {yTicks.map(v=>(
                  <line key={v} x1={PAD.left} x2={PAD.left+plotW} y1={yOf(v)} y2={yOf(v)}
                    stroke="#1a1a1a" strokeWidth="1"/>
                ))}
                {/* Area fill */}
                {areaPoints&&(
                  <polygon points={areaPoints} fill="#c8f72c" fillOpacity="0.07"/>
                )}
                {/* Line */}
                {points.length>=2&&(
                  <polyline points={linePoints} fill="none" stroke="#c8f72c" strokeWidth="2"
                    strokeLinejoin="round" strokeLinecap="round"/>
                )}
                {/* Dots */}
                {points.map(p=>{
                  const isSel=selected?.date===p.date;
                  return(
                    <g key={p.date}>
                      {isSel&&<circle cx={xOf(p.idx)} cy={yOf(p.kg)} r="10" fill="#c8f72c" fillOpacity="0.15"/>}
                      <circle cx={xOf(p.idx)} cy={yOf(p.kg)} r={isSel?5:3}
                        fill={isSel?"#c8f72c":"#8aaa40"} stroke="#0c0c0c" strokeWidth="1.5"/>
                    </g>
                  );
                })}
                {/* Selected vertical line */}
                {selected&&(
                  <line x1={xOf(selected.idx)} x2={xOf(selected.idx)}
                    y1={PAD.top} y2={PAD.top+plotH}
                    stroke="#c8f72c" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5"/>
                )}
                {/* Y-axis labels */}
                {yTicks.map(v=>(
                  <text key={v} x={PAD.left-5} y={yOf(v)+4} textAnchor="end"
                    fill="#3a3a3a" fontSize="9" fontFamily="monospace">{v}</text>
                ))}
                {/* X-axis labels */}
                {xLabels.map(({idx,label})=>(
                  <text key={idx} x={xOf(idx)} y={H-6} textAnchor="middle"
                    fill="#3a3a3a" fontSize="8" fontFamily="monospace">{label}</text>
                ))}
                {/* Y axis line */}
                <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top+plotH} stroke="#2a2a2a" strokeWidth="1"/>
                {/* X axis line */}
                <line x1={PAD.left} x2={PAD.left+plotW} y1={PAD.top+plotH} y2={PAD.top+plotH} stroke="#2a2a2a" strokeWidth="1"/>
              </svg>
            </div>
          ):(
            <div style={{background:"#0c0c0c",border:"1px solid #1a1a1a",borderRadius:12,padding:"60px 20px",
              textAlign:"center",color:"#2a2a2a",fontSize:11,letterSpacing:2,textTransform:"uppercase"}}>
              No weight data<br/>in the last 30 days
            </div>
          )}

          {/* Summary stats */}
          {points.length>=2&&(()=>{
            const avg=(points.reduce((a,p)=>a+p.kg,0)/points.length).toFixed(1);
            const diff=(points[points.length-1].kg-points[0].kg).toFixed(1);
            const diffColor=diff<0?C.green:diff>0?"#e85d2a":C.muted;
            return(
              <div style={{display:"flex",gap:10,marginTop:14}}>
                {[
                  {label:"Avg",value:`${avg} kg`},
                  {label:"Change",value:`${diff>0?"+":""}${diff} kg`,color:diffColor},
                  {label:"Entries",value:points.length},
                ].map(st=>(
                  <div key={st.label} style={{flex:1,background:"#0c0c0c",border:"1px solid #1a1a1a",borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                    <div style={{fontSize:15,fontWeight:700,color:st.color||C.text,letterSpacing:-0.5}}>{st.value}</div>
                    <div style={{fontSize:8,color:"#3a3a3a",letterSpacing:2,textTransform:"uppercase",marginTop:3}}>{st.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    );
  }


  // ── STEPS GRAPH MODAL ─────────────────────────────────────
  function StepsGraphModal({onClose}){
    const [selected, setSelected] = useState(null);
    const svgRef = useRef(null);

    const today = new Date();
    const points = [];
    for(let i=29; i>=0; i--){
      const d = new Date(today);
      d.setDate(today.getDate()-i);
      const iso = d.toISOString().slice(0,10);
      const steps = dailySteps[iso];
      if(steps!=null) points.push({date:iso, steps, idx:29-i});
    }

    const W=320, H=180, PAD={top:16,right:16,bottom:40,left:52};
    const plotW=W-PAD.left-PAD.right;
    const plotH=H-PAD.top-PAD.bottom;

    const vals = points.map(p=>p.steps);
    const minV = vals.length ? 0 : 0;
    const maxV = vals.length ? Math.ceil(Math.max(...vals)*1.1/1000)*1000 : 10000;
    const range = maxV - minV || 1;

    function xOf(idx){ return PAD.left+(idx/29)*plotW; }
    function yOf(v){ return PAD.top+plotH-((v-minV)/range)*plotH; }

    const linePoints = points.map(p=>`${xOf(p.idx)},${yOf(p.steps)}`).join(" ");
    const areaPoints = points.length>=2
      ? `${xOf(points[0].idx)},${PAD.top+plotH} `+linePoints+` ${xOf(points[points.length-1].idx)},${PAD.top+plotH}`
      : "";

    const yTicks = [];
    const tickStep = maxV<=5000?1000:maxV<=10000?2000:5000;
    for(let v=0; v<=maxV; v+=tickStep) yTicks.push(v);

    const xLabels=[];
    [0,7,14,21,29].forEach(i=>{
      const d=new Date(today);
      d.setDate(today.getDate()-(29-i));
      xLabels.push({idx:i, label:d.toLocaleDateString("en-US",{month:"short",day:"numeric"})});
    });

    function fmtSteps(n){ return n>=1000?`${(n/1000).toFixed(1)}k`:String(n); }

    function handleClick(e){
      if(!svgRef.current||points.length===0) return;
      const rect=svgRef.current.getBoundingClientRect();
      const mx=(e.clientX-rect.left)*(W/rect.width);
      let best=null,bestDist=Infinity;
      points.forEach(p=>{
        const d=Math.abs(xOf(p.idx)-mx);
        if(d<bestDist){bestDist=d;best=p;}
      });
      if(best&&bestDist<40) setSelected(s=>s?.date===best.date?null:best);
      else setSelected(null);
    }

    const shortDate=iso=>new Date(iso).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});

    return(
      <div style={{position:"fixed",inset:0,zIndex:60,background:C.bg,display:"flex",flexDirection:"column"}}>
        <div style={{background:"#0f0f0f",borderBottom:"1px solid #1a1a1a",padding:"44px 18px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <button style={{background:"none",border:"1px solid #2a2a2a",color:"#777",borderRadius:6,padding:"10px 14px",cursor:"pointer",fontSize:12,...T,letterSpacing:1,flexShrink:0}}
            onClick={onClose}>← Back</button>
          <div style={{fontSize:16,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:C.text}}>Steps Graph</div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"20px 18px 40px"}}>
          <div style={{fontSize:10,color:"#3a3a3a",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>Last 30 days</div>

          {selected?(
            <div style={{background:"#0d1400",border:"1px solid #1e3000",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:28,fontWeight:700,color:C.green,letterSpacing:-1}}>{fmtSteps(selected.steps)}<span style={{fontSize:12,color:"#4a7a00",fontWeight:400}}> steps</span></div>
              <div>
                <div style={{fontSize:12,color:C.text,fontWeight:600}}>{shortDate(selected.date)}</div>
                <div style={{fontSize:10,color:"#4a6a00",marginTop:2,letterSpacing:1}}>tap again to deselect</div>
              </div>
            </div>
          ):(
            <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:10,padding:"12px 16px",marginBottom:16,
              fontSize:10,color:"#3a3a3a",letterSpacing:1,textTransform:"uppercase",textAlign:"center"}}>
              {points.length>0?"Tap graph to inspect a point":"No step data yet — log steps from any day's view"}
            </div>
          )}

          {points.length>0?(
            <div style={{background:"#0c0c0c",border:"1px solid #1a1a1a",borderRadius:12,overflow:"hidden",padding:"8px 0 4px"}}>
              <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%"
                style={{display:"block",cursor:"crosshair",touchAction:"none"}}
                onClick={handleClick}>
                {yTicks.map(v=>(
                  <line key={v} x1={PAD.left} x2={PAD.left+plotW} y1={yOf(v)} y2={yOf(v)} stroke="#1a1a1a" strokeWidth="1"/>
                ))}
                {areaPoints&&<polygon points={areaPoints} fill="#c8f72c" fillOpacity="0.07"/>}
                {points.length>=2&&(
                  <polyline points={linePoints} fill="none" stroke="#c8f72c" strokeWidth="2"
                    strokeLinejoin="round" strokeLinecap="round"/>
                )}
                {points.map(p=>{
                  const isSel=selected?.date===p.date;
                  return(
                    <g key={p.date}>
                      {isSel&&<circle cx={xOf(p.idx)} cy={yOf(p.steps)} r="10" fill="#c8f72c" fillOpacity="0.15"/>}
                      <circle cx={xOf(p.idx)} cy={yOf(p.steps)} r={isSel?5:3}
                        fill={isSel?"#c8f72c":"#8aaa40"} stroke="#0c0c0c" strokeWidth="1.5"/>
                    </g>
                  );
                })}
                {selected&&(
                  <line x1={xOf(selected.idx)} x2={xOf(selected.idx)}
                    y1={PAD.top} y2={PAD.top+plotH}
                    stroke="#c8f72c" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5"/>
                )}
                {yTicks.map(v=>(
                  <text key={v} x={PAD.left-5} y={yOf(v)+4} textAnchor="end"
                    fill="#3a3a3a" fontSize="9" fontFamily="monospace">{fmtSteps(v)}</text>
                ))}
                {xLabels.map(({idx,label})=>(
                  <text key={idx} x={xOf(idx)} y={H-6} textAnchor="middle"
                    fill="#3a3a3a" fontSize="8" fontFamily="monospace">{label}</text>
                ))}
                <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top+plotH} stroke="#2a2a2a" strokeWidth="1"/>
                <line x1={PAD.left} x2={PAD.left+plotW} y1={PAD.top+plotH} y2={PAD.top+plotH} stroke="#2a2a2a" strokeWidth="1"/>
              </svg>
            </div>
          ):(
            <div style={{background:"#0c0c0c",border:"1px solid #1a1a1a",borderRadius:12,padding:"60px 20px",
              textAlign:"center",color:"#2a2a2a",fontSize:11,letterSpacing:2,textTransform:"uppercase"}}>
              No step data<br/>in the last 30 days
            </div>
          )}

          {points.length>=2&&(()=>{
            const avg=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
            const best=Math.max(...vals);
            const diff=vals[vals.length-1]-vals[0];
            const diffColor=diff>=0?C.green:"#e85d2a";
            return(
              <div style={{display:"flex",gap:10,marginTop:14}}>
                {[
                  {label:"Avg",value:fmtSteps(avg)},
                  {label:"Best",value:fmtSteps(best)},
                  {label:"Trend",value:`${diff>=0?"+":""}${fmtSteps(Math.abs(diff))}`,color:diffColor},
                ].map(st=>(
                  <div key={st.label} style={{flex:1,background:"#0c0c0c",border:"1px solid #1a1a1a",borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                    <div style={{fontSize:15,fontWeight:700,color:st.color||C.text}}>{st.value}</div>
                    <div style={{fontSize:8,color:"#3a3a3a",letterSpacing:2,textTransform:"uppercase",marginTop:3}}>{st.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ── ANATOMY MODAL ─────────────────────────────────────────

  function AnatomyModal(){


    const [scale,setScale]=React.useState(1);
    const [offset,setOffset]=React.useState({x:0,y:0});
    const lastPinch=React.useRef(null);
    const lastDrag=React.useRef(null);
    const isDragging=React.useRef(false);
    const imgRef=React.useRef(null);

    function clampOffset(x,y,sc){
      const el=imgRef.current;
      if(!el) return {x,y};
      const pw=el.parentElement.offsetWidth;
      const ph=el.parentElement.offsetHeight;
      const iw=el.offsetWidth*sc;
      const ih=el.offsetHeight*sc;
      const maxX=Math.max(0,(iw-pw)/2);
      const maxY=Math.max(0,(ih-ph)/2);
      return {x:Math.min(maxX,Math.max(-maxX,x)), y:Math.min(maxY,Math.max(-maxY,y))};
    }

    function onTouchStart(e){
      if(e.touches.length===2){
        const dx=e.touches[0].clientX-e.touches[1].clientX;
        const dy=e.touches[0].clientY-e.touches[1].clientY;
        lastPinch.current={dist:Math.hypot(dx,dy),scale,offset};
        lastDrag.current=null;
      } else if(e.touches.length===1){
        lastDrag.current={x:e.touches[0].clientX,y:e.touches[0].clientY,ox:offset.x,oy:offset.y};
        lastPinch.current=null;
      }
    }
    function onTouchMove(e){
      e.preventDefault();
      if(e.touches.length===2&&lastPinch.current){
        const dx=e.touches[0].clientX-e.touches[1].clientX;
        const dy=e.touches[0].clientY-e.touches[1].clientY;
        const dist=Math.hypot(dx,dy);
        const newScale=Math.min(6,Math.max(1,lastPinch.current.scale*(dist/lastPinch.current.dist)));
        const clamped=clampOffset(lastPinch.current.offset.x,lastPinch.current.offset.y,newScale);
        setScale(newScale);
        setOffset(clamped);
      } else if(e.touches.length===1&&lastDrag.current&&scale>1){
        const dx=e.touches[0].clientX-lastDrag.current.x;
        const dy=e.touches[0].clientY-lastDrag.current.y;
        setOffset(clampOffset(lastDrag.current.ox+dx,lastDrag.current.oy+dy,scale));
      }
    }
    function onTouchEnd(e){
      if(e.touches.length<2) lastPinch.current=null;
      if(e.touches.length===0) lastDrag.current=null;
    }
    function onDblTap(){
      if(scale>1){setScale(1);setOffset({x:0,y:0});}
      else{setScale(2.5);setOffset({x:0,y:0});}
    }
    return(
      <div style={{position:"fixed",inset:0,zIndex:200,background:"#000",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"44px 18px 12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",
          background:"#0a0a0a",borderBottom:"1px solid #1a1a1a",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button style={{background:"none",border:"1px solid #2a2a2a",color:"#777",borderRadius:6,padding:"10px 14px",cursor:"pointer",fontSize:12,fontFamily:"inherit",letterSpacing:1,flexShrink:0}}
              onClick={()=>{setAnatomyOpen(false);setScreen("home");}}>← Back</button>
            <div>
              <div style={{fontSize:16,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#e8e8e8"}}>Human Anatomy</div>
              <div style={{fontSize:10,color:"#333",letterSpacing:2,marginTop:2}}>PINCH TO ZOOM · DOUBLE TAP TO RESET</div>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflow:"hidden",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
          touchAction:"none",userSelect:"none"}}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onDoubleClick={onDblTap}>
          <img ref={imgRef}
            src={process.env.PUBLIC_URL+"/anatomy.png"}
            alt="Human Anatomy"
            style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",
              transform:"translate("+offset.x+"px,"+offset.y+"px) scale("+scale+")",
              transformOrigin:"center center",
              transition:lastPinch.current||lastDrag.current?"none":"transform 0.2s ease",
              imageRendering:"crisp-edges",
              display:"block"}}
            draggable={false}
          />
        </div>
        <div style={{textAlign:"center",padding:"8px",fontSize:10,color:"#222",background:"#0a0a0a",flexShrink:0}}>
          {scale>1?"Drag to pan · Double tap to reset":"Pinch to zoom · Double tap to zoom in"}
        </div>
      </div>
    );
  }

  // ── WIZARD ───────────────────────────────────────────────
  function Wizard(){
    const {step,date,mId,eId,sid}=wizard;
    const muscle  = mId?getMuscle(mId):null;
    const exer    = eId?getEx(mId,eId):null;
    const session = sid?getSess(mId,eId,sid):null;
    const [editNote,setEN]=useState(false);
    const [noteVal, setNV]=useState(session?.note||"");
    const [exSearch,setExSearch]=useState("");
    const fabVisible=wizFabVisible;

    if(step==="muscle") {
      const globalSearch = exSearch.trim();
      const globalResults = globalSearch
        ? muscles.flatMap(m=>
            m.exercises
              .filter(e=>e.name.toLowerCase().includes(globalSearch.toLowerCase()))
              .map(e=>({...e,mId:m.id,mName:m.name}))
          )
        : null;

      const hiGlobal=(name)=>{
        if(!globalSearch) return name;
        const idx=name.toLowerCase().indexOf(globalSearch.toLowerCase());
        if(idx<0) return name;
        return <>{name.slice(0,idx)}<span style={{color:C.green,fontWeight:700}}>{name.slice(idx,idx+globalSearch.length)}</span>{name.slice(idx+globalSearch.length)}</>;
      };

      return (
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
          <div style={hdr}>
            <button style={bkBtn} onClick={()=>setWizard(null)}>✕</button>
            <div style={{flex:1,minWidth:0}}>
              <div style={ttl}>Record Session</div>
              <div style={sub}>{globalSearch?"Search results":"Pick a muscle group"}</div>
            </div>
          </div>
          <div ref={wScrollRef} style={{flex:1,overflowY:"auto",paddingBottom:100}}>
            {/* ── Body weight + Steps — two side-by-side buttons ── */}
            {(()=>{
              const bw=dailyWeights[date]; const st=dailySteps[date];
              const btnBase={flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                padding:"10px 8px",borderRadius:10,cursor:"pointer",border:"1px solid",transition:"border-color 0.15s"};
              return(
                <div style={{display:"flex",gap:8,padding:"10px 14px 4px"}}>
                  <div style={{...btnBase,background:bw!=null?"#0d1400":C.card,borderColor:bw!=null?"#1e3000":C.border}}
                    onClick={()=>setModal({type:"dayWeight",date})}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=bw!=null?"#2a4400":"#2a2a2a"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=bw!=null?"#1e3000":C.border}>
                    <span style={{fontSize:18}}>🏋</span>
                    <div style={{fontSize:10,fontWeight:700,color:bw!=null?C.green:C.muted,letterSpacing:0.5}}>Body Weight</div>
                    <div style={{fontSize:11,color:bw!=null?"#4a7a00":"#2a2a2a",fontWeight:bw!=null?700:400}}>
                      {bw!=null?`${bw} kg`:"— kg"}
                    </div>
                  </div>
                  <div style={{...btnBase,background:st!=null?"#00141e":C.card,borderColor:st!=null?"#003a4a":C.border}}
                    onClick={()=>setModal({type:"daySteps",date})}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=st!=null?"#005a70":"#2a2a2a"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=st!=null?"#003a4a":C.border}>
                    <span style={{fontSize:18}}>👟</span>
                    <div style={{fontSize:10,fontWeight:700,color:st!=null?"#5bc8f5":C.muted,letterSpacing:0.5}}>Steps</div>
                    <div style={{fontSize:11,color:st!=null?"#2a7a9a":"#2a2a2a",fontWeight:st!=null?700:400}}>
                      {st!=null?(st>=1000?`${(st/1000).toFixed(1)}k`:`${st}`):"— steps"}
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* ── Global exercise search bar ── */}
            <div style={{padding:"8px 14px 8px",borderBottom:"1px solid #141414"}}>
              <div style={{position:"relative",display:"flex",alignItems:"center"}}>
                <span style={{position:"absolute",left:13,fontSize:14,color:"#3a3a3a",pointerEvents:"none"}}>⌕</span>
                <input
                  style={{...inp,marginBottom:0,paddingLeft:36,background:"#0f0f0f",border:"1px solid #1e1e1e"}}
                  placeholder="Search all exercises…"
                  value={exSearch}
                  onChange={e=>setExSearch(e.target.value)}
                />
                {exSearch&&<button
                  style={{position:"absolute",right:10,background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:16,padding:"4px",lineHeight:1}}
                  onMouseDown={e=>{e.preventDefault();setExSearch("");}}>✕</button>}
              </div>
            </div>
            {/* ── Search results OR muscle list ── */}
            {globalResults ? (
              <>
                {globalResults.length===0
                  ? <div style={mpt}>No exercises match<br/>"{exSearch}"</div>
                  : globalResults.map(e=>{
                      const last=sortSess(e.sessions)[0];
                      const maxW=last?.sets.filter(s=>s.weight!=null).length?Math.max(...last.sets.filter(s=>s.weight!=null).map(s=>s.weight)):0;
                      return(
                        <div key={e.id} style={crd}
                          onClick={()=>{ const ns=addSession(e.mId,e.id,date); setWizard(w=>({...w,step:"sets",mId:e.mId,eId:e.id,sid:ns})); setExSearch(""); }}
                          onMouseEnter={el=>el.currentTarget.style.borderColor="#2a2a2a"}
                          onMouseLeave={el=>el.currentTarget.style.borderColor=C.border}>
                          <MuscleIcon muscle={e.mName} size={44}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:600,fontSize:14}}>{hiGlobal(e.name)}</div>
                            <div style={{fontSize:11,color:C.muted,marginTop:3}}>{e.mName}{maxW>0?` · Last max: ${maxW}kg`:""}</div>
                          </div>
                          <span style={{color:"#3a3a3a",fontSize:18}}>›</span>
                        </div>
                      );
                    })
                }
              </>
            ) : (
              <>
                <div style={{margin:"4px 14px 0",borderTop:"1px solid #161616",paddingTop:4}}/>
                {muscles.map(m=>(
                  <div key={m.id} style={crd}
                    onClick={()=>setWizard({step:"exercise",date,mId:m.id})}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#2a2a2a"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                    <MuscleIcon muscle={m.name} size={44}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:14}}>{m.name}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:3}}>{m.exercises.length} exercises</div>
                    </div>
                    <span style={{color:"#3a3a3a",fontSize:18}}>›</span>
                  </div>
                ))}
              </>
            )}
          </div>
          <FloatBtn label="✕  Cancel" onClick={()=>setWizard(null)} visible={fabVisible}/>
        </div>
      );
    }

    if(step==="exercise"&&muscle) {
      const filtered = sortEx(muscle.exercises).filter(e=>
        e.name.toLowerCase().includes(exSearch.toLowerCase())
      );
      return (
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
          <div style={hdr}>
            <button style={bkBtn} onClick={()=>setWizard(w=>({...w,step:"muscle",eId:null,sid:null}))}>← Back</button>
            <div style={{flex:1,minWidth:0}}>
              <div style={ttl}>{muscle.name}</div>
              <div style={sub}>Pick an exercise</div>
            </div>
          </div>
          {/* Search bar — sticky below header */}
          <div style={{padding:"10px 14px 6px",background:C.bg,borderBottom:"1px solid #141414",position:"sticky",top:0,zIndex:10}}>
            <div style={{position:"relative",display:"flex",alignItems:"center"}}>
              <span style={{position:"absolute",left:13,fontSize:14,color:"#3a3a3a",pointerEvents:"none"}}>⌕</span>
              <input
                style={{...inp,marginBottom:0,paddingLeft:36,background:"#0f0f0f",border:"1px solid #1e1e1e"}}
                placeholder="Search exercises…"
                value={exSearch}
                onChange={e=>setExSearch(e.target.value)}
              />
              {exSearch&&<button
                style={{position:"absolute",right:10,background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:16,padding:"4px",lineHeight:1}}
                onMouseDown={e=>{e.preventDefault();setExSearch("");}}>✕</button>}
            </div>
          </div>
          <div ref={wScrollRef} style={{flex:1,overflowY:"auto",paddingBottom:100}}>
            {filtered.length===0&&<div style={mpt}>No exercises match<br/>"{exSearch}"</div>}
            {filtered.map(e=>{
              const last=sortSess(e.sessions)[0];
              const maxW=last?.sets.filter(s=>s.weight!=null).length?Math.max(...last.sets.filter(s=>s.weight!=null).map(s=>s.weight)):0;
              // Highlight matching text
              const hi=(name)=>{
                if(!exSearch.trim()) return name;
                const idx=name.toLowerCase().indexOf(exSearch.toLowerCase());
                if(idx<0) return name;
                return <>{name.slice(0,idx)}<span style={{color:C.green,fontWeight:700}}>{name.slice(idx,idx+exSearch.length)}</span>{name.slice(idx+exSearch.length)}</>;
              };
              return(
                <div key={e.id} style={crd}
                  onClick={()=>{ const ns=addSession(mId,e.id,date); setWizard(w=>({...w,step:"sets",eId:e.id,sid:ns})); }}
                  onMouseEnter={el=>el.currentTarget.style.borderColor="#2a2a2a"}
                  onMouseLeave={el=>el.currentTarget.style.borderColor=C.border}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14}}>{hi(e.name)}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:3}}>{e.sessions.length} sessions{maxW>0?` · Last max: ${maxW}kg`:""}</div>
                  </div>
                  <span style={{color:"#3a3a3a",fontSize:18}}>›</span>
                </div>
              );
            })}
          </div>
          <FloatBtn label="← Back" onClick={()=>setWizard(w=>({...w,step:"muscle",eId:null,sid:null}))} visible={wizFabVisible} left/>
        </div>
      );
    }

    if(step==="sets"&&session){
      return (
        <SetsLogger mId={mId} eId={eId} sid={sid} date={date} muscle={muscle} exer={exer} session={session}
          onBack={()=>{
            // If no sets logged, clean up the empty session before going back
            if(!session?.sets?.length) delSession(mId,eId,sid);
            setWizard(w=>({...w,step:"exercise",sid:null}));
          }}
          onDone={()=>{setWizard(null);setViewDay(date);setScreen("day");}}/>
      );
    }
    return null;
  }

  // ── SETS LOGGER (inline input + rest timer) ──────────────

  // ── TIMER BAR — shared between SetsLogger & ExerciseDetail ──
  // State lives in timerMap ref keyed by sid. No storage.
  function TimerBar({sid}){
    const MAX_SEC=30*60; // 30 minutes — then auto-stop and clear
    const [,forceRender]=useState(0);
    const tick=()=>forceRender(n=>n+1);

    useEffect(()=>{
      let iv=null;
      if(timerMap.current[sid]?.running){
        iv=setInterval(()=>{
          const t=timerMap.current[sid];
          if(!t?.running){ clearInterval(iv); return; }
          const totalElapsed=t.elapsed+Math.floor((Date.now()-t.start)/1000);
          if(totalElapsed>=MAX_SEC){
            // Hit 30 min — stop and wipe
            delete timerMap.current[sid];
            clearInterval(iv);
          }
          forceRender(n=>n+1);
        },1000);
      }
      return ()=>{ if(iv) clearInterval(iv); };
    },[sid, timerMap.current[sid]?.running]);

    const t=timerMap.current[sid]||{running:false,elapsed:0,start:null};
    const elapsed=t.running ? t.elapsed+Math.floor((Date.now()-t.start)/1000) : t.elapsed;
    const mm=String(Math.floor(elapsed/60)).padStart(2,"0");
    const ss=String(elapsed%60).padStart(2,"0");
    const active=t.running||t.elapsed>0;

    const start=()=>{
      timerMap.current[sid]={running:true,elapsed:t.elapsed,start:Date.now()};
      tick();
    };
    const stop=()=>{
      const cur=timerMap.current[sid]||{elapsed:0};
      timerMap.current[sid]={running:false,elapsed:cur.elapsed+Math.floor((Date.now()-cur.start)/1000),start:null};
      tick();
    };
    const reset=()=>{ delete timerMap.current[sid]; tick(); };

    return(
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",
        background:"#0a0a0a",borderBottom:"1px solid #141414",flexShrink:0}}>
        <div style={{background:active?"#0d1400":"#0d0d0d",border:`1px solid ${active?"#1e3000":"#1a1a1a"}`,
          borderRadius:8,padding:"6px 12px",minWidth:68,textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:17,fontWeight:700,color:active?C.green:"#2a2a2a",letterSpacing:2,fontVariantNumeric:"tabular-nums"}}>{mm}:{ss}</div>
          <div style={{fontSize:7,color:"#2a3a10",letterSpacing:2,textTransform:"uppercase",marginTop:1}}>rest</div>
        </div>
        <button style={{...bkBtn,padding:"10px 14px",fontSize:15,
          color:t.running?"#ff8800":"#6a9a00",
          borderColor:t.running?"#3a1a00":"#1e3000"}}
          onClick={t.running?stop:start}>
          {t.running?"⏸":"▶"}
        </button>
        {!t.running&&t.elapsed>0&&(
          <button style={{...bkBtn,padding:"10px 14px",fontSize:14,color:"#555",borderColor:"#1a1a1a"}}
            onClick={reset}>↺</button>
        )}
        <div style={{flex:1,fontSize:9,color:"#252525",letterSpacing:1,textTransform:"uppercase",textAlign:"right"}}>
          {t.running?`stops at 30:00`:active?"stopped":"▶ to time rest"}
        </div>
      </div>
    );
  }

    function SetsLogger({mId,eId,sid,date,muscle,exer,session,onBack,onDone}){
    const rScrollRef=useRef(null);
    const rFabVisible=useScrollVisible(rScrollRef);

    return(
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={hdr}>
          <button style={bkBtn} onClick={onBack}>← Back</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={ttl}>{exer?.name}</div>
            <div style={sub}>{muscle?.name} · {fmtDate(date)}</div>
          </div>
        </div>
        <StatsBar sets={session.sets}/>
        <TimerBar sid={sid}/>
        {(()=>{
          // Find last session of same exercise (not current) to offer copy
          const prevSess = sortSess(exer?.sessions||[]).find(s=>s.id!==sid&&s.sets.length>0);
          if(!prevSess) return null;
          return(
            <div style={{borderBottom:"1px solid #141414",padding:"8px 14px",display:"flex",alignItems:"center",gap:10,background:"#0a0a0a"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,color:"#555",letterSpacing:1}}>
                  Last session · {fmtDate(prevSess.date)}
                </div>
                <div style={{fontSize:10,color:"#3a3a3a",marginTop:2}}>
                  {prevSess.sets.map((s,i)=>{
                    if(s.type==="super") return `S${i+1}: super`;
                    const w=s.weight!=null?`${s.weight}kg`:"bw";
                    return `S${i+1}: ${w}×${s.reps}`;
                  }).join("  ·  ")}
                </div>
              </div>
              <button
                style={{...bkBtn,padding:"8px 12px",fontSize:11,color:"#6a9a00",borderColor:"#1e3000",flexShrink:0,whiteSpace:"nowrap"}}
                onClick={()=>{
                  prevSess.sets.forEach(s=>{
                    addSet(mId,eId,sid,{
                      weight:s.weight,reps:s.reps,type:s.type||"normal",
                      note:s.note||"",dropSets:s.dropSets||[],superSets:s.superSets||[]
                    });
                  });
                }}>
                ⎘ Copy sets
              </button>
            </div>
          );
        })()}
        <div ref={rScrollRef} style={{flex:1,overflowY:"auto",paddingBottom:110}}>
          {session.sets.length===0
            ? <div style={mpt}>No sets yet<br/>Tap + Log Set to start</div>
            : <>
                <div style={sLbl}>Sets</div>
                <SetList sets={session.sets} mId={mId} eId={eId} sid={sid}/>
              </>
          }
        </div>
        <FloatBtn label="+ Log Set" onClick={()=>setModal({type:"addSet",mId,eId,sid})} visible={true} left/>
        {session.sets.length>0&&<FloatBtn label="Done ✓" onClick={onDone} visible={true} right/>}
      </div>
    );
  }

    // ── CALENDAR OVERLAY ─────────────────────────────────────
  function CalendarOverlay(){
    const today = new Date();
    const [yr,  setYr]  = useState(today.getFullYear());
    const [mon, setMon] = useState(today.getMonth()); // 0-indexed

    // Build set of all dates that have sessions
    const sessionDates = new Set(getAllSessions(muscles).map(s=>s.date));

    const monthName = new Date(yr,mon,1).toLocaleString("en-US",{month:"long",year:"numeric"});
    const firstDay  = new Date(yr,mon,1).getDay(); // 0=Sun
    const daysInMonth = new Date(yr,mon+1,0).getDate();
    const todayStr  = today.toISOString().slice(0,10);

    const prevMon = ()=>{ if(mon===0){setMon(11);setYr(y=>y-1);}else setMon(m=>m-1); };
    const nextMon = ()=>{ if(mon===11){setMon(0);setYr(y=>y+1);}else setMon(m=>m+1); };
    const calSwipeRef=useRef(null);
    const onCalSwipeStart=e=>{const t=e.touches[0];calSwipeRef.current={x:t.clientX,y:t.clientY};};
    const onCalSwipeEnd=e=>{
      if(!calSwipeRef.current) return;
      const dx=calSwipeRef.current.x-e.changedTouches[0].clientX;
      const dy=Math.abs(calSwipeRef.current.y-e.changedTouches[0].clientY);
      if(Math.abs(dx)>50&&dy<60){ dx>0?nextMon():prevMon(); }
      calSwipeRef.current=null;
    };

    const cells = [];
    // Empty cells before first day
    for(let i=0;i<firstDay;i++) cells.push(null);
    for(let d=1;d<=daysInMonth;d++) cells.push(d);

    const pad = n=>String(n).padStart(2,"0");
    const dateStr = d=>`${yr}-${pad(mon+1)}-${pad(d)}`;

    return (
      <div style={{position:"fixed",inset:0,background:C.bg,zIndex:100,display:"flex",flexDirection:"column",...T}}
        onClick={()=>setCalOpen(false)}>
        <div style={{background:"#0f0f0f",borderBottom:"1px solid #1a1a1a",padding:"44px 18px 16px",display:"flex",alignItems:"center",gap:12}}
          onClick={e=>e.stopPropagation()}>
          <button style={bkBtn} onClick={()=>setCalOpen(false)}>✕</button>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:13,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:C.text}}>Calendar</div>
          </div>
          {/* placeholder to balance the back button */}
          <div style={{width:52}}/>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"0 14px 40px"}} onClick={e=>e.stopPropagation()}>
          {/* Month nav */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 4px 12px"}}>
            <button style={{...bkBtn,padding:"8px 16px"}} onClick={prevMon}>‹</button>
            <div style={{fontSize:13,fontWeight:700,color:C.text,letterSpacing:1,textTransform:"uppercase"}}>{monthName}</div>
            <button style={{...bkBtn,padding:"8px 16px"}} onClick={nextMon}>›</button>
          </div>

          {/* Day-of-week headers */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
            {["S","M","T","W","T","F","S"].map((d,i)=>(
              <div key={i} style={{textAlign:"center",fontSize:10,color:"#333",letterSpacing:1,padding:"4px 0",textTransform:"uppercase"}}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}
            onTouchStart={onCalSwipeStart} onTouchEnd={onCalSwipeEnd}>
            {cells.map((d,i)=>{
              if(!d) return <div key={i}/>;
              const ds=dateStr(d);
              const hasSess=sessionDates.has(ds);
              const isToday=ds===todayStr;
              const bw=dailyWeights[ds];
              return(
                <div key={i}
                  style={{
                    aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",
                    justifyContent:"center",borderRadius:8,cursor:hasSess?"pointer":"default",
                    background: isToday?"#1a2a00": hasSess?"#111":"transparent",
                    border: isToday?`1px solid ${C.green}`: hasSess?"1px solid #1e1e1e":"1px solid transparent",
                    position:"relative",
                  }}
                  onClick={()=>{ if(hasSess){ setViewDay(ds); setCalOpen(false); setScreen("day"); } }}>
                  <span style={{fontSize:13,fontWeight: isToday?700:hasSess?600:400, color: isToday?C.green: hasSess?"#ccc":"#2a2a2a"}}>
                    {d}
                  </span>
                  {hasSess&&(
                    <div style={{width:4,height:4,borderRadius:"50%",background:C.green,marginTop:2}}/>
                  )}
                  {bw!=null&&(
                    <div style={{fontSize:7,color:"#4a7a00",letterSpacing:0.5,marginTop:1,lineHeight:1}}>{bw}kg</div>
                  )}
                  {dailySteps[ds]!=null&&(
                    <div style={{fontSize:7,color:"#2a8aaa",letterSpacing:0.5,marginTop:1,lineHeight:1}}>{dailySteps[ds]>=1000?`${(dailySteps[ds]/1000).toFixed(1)}k`:dailySteps[ds]}s</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Session count for current month */}
          {(()=>{
            const count=[...sessionDates].filter(d=>d.startsWith(`${yr}-${pad(mon+1)}`)).length;
            return count>0?(
              <div style={{textAlign:"center",marginTop:20,fontSize:11,color:"#333",letterSpacing:2,textTransform:"uppercase"}}>
                {count} session{count!==1?"s":""} this month
              </div>
            ):null;
          })()}
        </div>
      </div>
    );
  }

  // ── HOME ─────────────────────────────────────────────────
  function Home(){
    const exDays=groupByDay(getAllSessions(muscles));
    // Merge in dates that only have BW or steps (no exercises)
    const allDateSet=new Set(exDays.map(d=>d.date));
    Object.keys(dailyWeights).forEach(d=>{ if(dailyWeights[d]!=null) allDateSet.add(d); });
    Object.keys(dailySteps).forEach(d=>{ if(dailySteps[d]!=null) allDateSet.add(d); });
    const days=[...allDateSet].sort((a,b)=>b.localeCompare(a)).map(date=>{
      const found=exDays.find(d=>d.date===date);
      return {date, sessions:found?found.sessions:[]};
    });
    const PREVIEW=2;
    const today=new Date().toISOString().slice(0,10);

    const statsItems=[
      {label:"Sessions",value:weekSessions||"-",sub:"this week"},
      {label:"Streak",value:streak?`${streak}d`:"0d",sub:streak>=3?"🔥 on fire!":streak>0?"keep going":"start today"},
      {label:"Exercises",value:weekTotalEx||"-",sub:"this week"},
    ];

    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={hdr}>
          <button style={mnBtn} onClick={()=>setSidebar(true)}>☰</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={ttl}>GymLog</div>
            <div style={{...sub,fontSize:11,letterSpacing:1,color:"#555"}}>{activeUser?.name} · Push harder than Yesterday 💪🔥</div>
          </div>
        </div>

        <div ref={scrollRef} style={{flex:1,overflowY:"auto",paddingBottom:110}}>

          {/* ── Weekly stats strip ── */}
          <div style={{display:"flex",borderBottom:"1px solid #141414",background:"#0c0c0c"}}>
            {statsItems.map((st,i)=>(
              <div key={st.label} style={{flex:1,padding:"12px 0",textAlign:"center",borderRight:i<2?"1px solid #141414":"none"}}>
                <div style={{fontSize:18,fontWeight:700,color:C.green,letterSpacing:-0.5}}>{st.value}</div>
                <div style={{fontSize:8,color:"#555",letterSpacing:2,textTransform:"uppercase",marginTop:2}}>{st.label}</div>
                <div style={{fontSize:8,color:"#2a3a10",marginTop:1}}>{st.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Feature carousel ── */}
          {(()=>{
            const cards=[
              {
                id:"anatomy",
                icon:"🫀",
                title:"Human Anatomy",
                desc:"Interactive muscle map",
                onClick:()=>setAnatomyOpen(true),
              },
              {
                id:"calendar",
                icon:"📅",
                title:"Calendar",
                desc:"Browse sessions by date",
                onClick:()=>setCalOpen(true),
              },
              {
                id:"weight",
                icon:"🏋",
                title:"Weight Graph",
                desc:"Last 30 days progress",
                onClick:()=>setBwOpen(true),
              },
              {
                id:"steps",
                icon:"👟",
                title:"Steps Graph",
                desc:"Daily step count trend",
                onClick:()=>setStepsOpen(true),
              },
            ];
            return(
              <div style={{display:"flex",gap:10,padding:"12px 14px",overflowX:"auto",
                scrollSnapType:"x mandatory",WebkitOverflowScrolling:"touch",
                msOverflowStyle:"none",scrollbarWidth:"none"}}>
                {cards.map(card=>(
                  <div key={card.id}
                    onClick={card.onClick}
                    style={{flexShrink:0,width:140,background:"#111",border:"1px solid #1e1e1e",
                      borderRadius:12,padding:"14px 12px",cursor:"pointer",scrollSnapAlign:"start",
                      display:"flex",flexDirection:"column",gap:6,
                      transition:"border-color 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#c8f72c"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e1e"}>
                    <span style={{fontSize:28}}>{card.icon}</span>
                    <div style={{fontSize:12,fontWeight:700,color:C.green,letterSpacing:1}}>{card.title}</div>
                    <div style={{fontSize:10,color:"#3a3a3a",letterSpacing:0.5,lineHeight:1.4}}>{card.desc}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {days.length===0&&<div style={mpt}>No sessions yet<br/>Tap Record Session to start</div>}
          {days.map(({date,sessions})=>{
            const totalSets=sessions.reduce((a,s)=>a+s.sets.length,0);
            const visible=sessions.slice(0,PREVIEW);
            const hidden=sessions.length-PREVIEW;
            const goToDay=()=>{ setViewDay(date); setScreen("day"); };
            const bw=dailyWeights[date];
            const st=dailySteps[date];
            const bwOnlyDay=sessions.length===0;
            return(
              <div key={date} style={{margin:"6px 14px",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",cursor:"pointer"}}
                onClick={goToDay}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#2a2a2a"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                {/* Day header */}
                <div style={{padding:"10px 14px 8px",borderBottom:bwOnlyDay?"none":"1px solid #161616",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  <div style={{fontWeight:700,fontSize:13,color:C.text,letterSpacing:0.5,flex:1,minWidth:0}}>{fmtDate(date)}</div>
                  <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
                    {!bwOnlyDay&&<div style={{fontSize:10,color:"#3a3a3a",letterSpacing:1}}>{sessions.length} ex · {totalSets} sets</div>}
                  </div>
                </div>
                {/* Exercise rows — compact preview with color accent */}
                {visible.map((s,i)=>{
                  const maxW=s.sets.filter(t=>t.weight!=null).length?Math.max(...s.sets.filter(t=>t.weight!=null).map(t=>t.weight)):0;
                  const vol=s.sets.filter(t=>t.weight!=null).reduce((a,t)=>a+t.weight*t.reps,0);
                  return(
                    <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",
                      borderTop:i>0?"1px solid #111":"none"}}>
                      <MuscleIcon muscle={s.mName} size={26}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#c0c0c0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.eName}</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:1}}>
                          {s.sets.length} sets{maxW>0?` · ${maxW}kg`:""}{vol>0?` · ${vol}kg vol`:""}
                        </div>
                      </div>
                      <button style={{...dBtn,fontSize:15,padding:"4px 8px"}}
                        onClick={e=>{e.stopPropagation();setModal({type:"confirm",msg:"Delete this exercise?",onOk:()=>delSession(s.mId,s.eId,s.id)});}}
                        onMouseEnter={e=>e.currentTarget.style.color="#cc2222"}
                        onMouseLeave={e=>e.currentTarget.style.color="#252525"}>✕</button>
                    </div>
                  );
                })}
                {/* +N more indicator */}
                {hidden>0&&(
                  <div style={{padding:"6px 14px",borderTop:"1px solid #111",textAlign:"center"}}>
                    <span style={{fontSize:10,color:"#3a3a3a",letterSpacing:1,textTransform:"uppercase"}}>+{hidden} more ▼</span>
                  </div>
                )}
                {/* BW/steps only day — show quiet placeholder */}
                {bwOnlyDay&&(
                  <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontSize:10,color:"#2a2a2a",fontStyle:"italic",letterSpacing:0.5}}>No exercises logged</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <FloatBtn label="＋  Record Session" onClick={()=>setWizard({step:"muscle",date:new Date().toISOString().slice(0,10)})} visible={true}/>
      </div>
    );
  }

  function DayDetail(){
    const allDaySessions=getAllSessions(muscles).filter(s=>s.date===viewDay);
    const [localSessions,setLocalSessions]=useState(allDaySessions);
    const [dragging,setDragging]=useState(null);
    const [dragOver,setDragOver]=useState(null);
    const longPressTimer=useRef(null);
    const rowRefs=useRef([]);
    const dragState=useRef({active:false,idx:null});

    useEffect(()=>setLocalSessions(getAllSessions(muscles).filter(s=>s.date===viewDay)),[data,viewDay]);

    // If no exercises AND no body weight AND no steps → nothing left, go home
    useEffect(()=>{
      const bw=dailyWeights[viewDay];
      const st=dailySteps[viewDay];
      if(localSessions.length===0&&bw==null&&(st==null||st===undefined)){
        setScreen("home");
      }
    },[localSessions,dailyWeights,dailySteps,viewDay]);

    const startLongPress=(i,e)=>{
      e.stopPropagation();
      longPressTimer.current=setTimeout(()=>{
        dragState.current={active:true,idx:i};
        setDragging(i);
        if(navigator.vibrate) navigator.vibrate(40);
      },350);
    };
    const cancelLongPress=()=>{
      clearTimeout(longPressTimer.current);
    };
    const onTouchMove=(e)=>{
      if(!dragState.current.active) return;
      e.preventDefault();
      const y=e.touches[0].clientY;
      let over=null;
      rowRefs.current.forEach((ref,i)=>{
        if(!ref) return;
        const rect=ref.getBoundingClientRect();
        if(y>=rect.top&&y<=rect.bottom) over=i;
      });
      if(over!==null&&over!==dragState.current.idx) setDragOver(over);
    };
    const onTouchEnd=()=>{
      clearTimeout(longPressTimer.current);
      if(dragState.current.active){
        const from=dragState.current.idx;
        const to=dragOver;
        if(from!==null&&to!==null&&from!==to){
          const arr=[...localSessions];
          const [moved]=arr.splice(from,1);
          arr.splice(to,0,moved);
          setLocalSessions(arr);
          reorderDaySessions(arr);
        }
      }
      dragState.current={active:false,idx:null};
      setDragging(null);
      setDragOver(null);
    };

    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={hdr}>
          <button style={bkBtn} onClick={()=>setScreen("home")}>← Back</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={ttl}>{viewDay?fmtDate(viewDay):""}</div>
            <div style={sub}>{localSessions.length} exercise{localSessions.length!==1?"s":""}</div>
          </div>
        </div>
        <div ref={scrollRef} style={{flex:1,overflowY:"auto",paddingBottom:110}}>
          {/* ── Body weight + Steps — two side-by-side buttons ── */}
          {(()=>{
            const bw=dailyWeights[viewDay]; const st=dailySteps[viewDay];
            const btnBase={flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,
              padding:"10px 8px",borderRadius:10,cursor:"pointer",border:"1px solid",transition:"border-color 0.15s"};
            return(
              <div style={{display:"flex",gap:8,padding:"10px 14px 4px"}}>
                <div style={{...btnBase,background:bw!=null?"#0d1400":C.card,borderColor:bw!=null?"#1e3000":C.border}}
                  onClick={()=>setModal({type:"dayWeight",date:viewDay})}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=bw!=null?"#2a4400":"#2a2a2a"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=bw!=null?"#1e3000":C.border}>
                  <span style={{fontSize:18}}>🏋</span>
                  <div style={{fontSize:10,fontWeight:700,color:bw!=null?C.green:C.muted,letterSpacing:0.5}}>Body Weight</div>
                  <div style={{fontSize:11,color:bw!=null?"#4a7a00":"#2a2a2a",fontWeight:bw!=null?700:400}}>
                    {bw!=null?`${bw} kg`:"— kg"}
                  </div>
                </div>
                <div style={{...btnBase,background:st!=null?"#00141e":C.card,borderColor:st!=null?"#003a4a":C.border}}
                  onClick={()=>setModal({type:"daySteps",date:viewDay})}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=st!=null?"#005a70":"#2a2a2a"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=st!=null?"#003a4a":C.border}>
                  <span style={{fontSize:18}}>👟</span>
                  <div style={{fontSize:10,fontWeight:700,color:st!=null?"#5bc8f5":C.muted,letterSpacing:0.5}}>Steps</div>
                  <div style={{fontSize:11,color:st!=null?"#2a7a9a":"#2a2a2a",fontWeight:st!=null?700:400}}>
                    {st!=null?(st>=1000?`${(st/1000).toFixed(1)}k`:`${st}`):"— steps"}
                  </div>
                </div>
              </div>
            );
          })()}
          {/* ── Separator ── */}
          <div style={{margin:"4px 14px 0",borderTop:"1px solid #161616",paddingTop:4}}/>
          {localSessions.length===0&&<div style={mpt}>No exercises logged<br/>Tap Add Exercise below</div>}
          <div onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            {localSessions.map((s,i)=>{
              const maxW=s.sets.filter(t=>t.weight!=null).length?Math.max(...s.sets.filter(t=>t.weight!=null).map(t=>t.weight)):0;
              const vol =s.sets.filter(t=>t.weight!=null).reduce((a,t)=>a+t.weight*t.reps,0);
              const isDragging=dragging===i;
              const isOver=dragOver===i&&dragging!==null&&dragging!==i;
              const isExpanded=expandedDay===s.id;
              return(
                <div key={s.id} ref={el=>rowRefs.current[i]=el}
                  style={{...crd,flexDirection:"column",alignItems:"stretch",padding:0,overflow:"hidden",
                    opacity:isDragging?0.35:1,
                    borderColor:isOver?C.green:C.border,
                    transform:isOver?"translateY(-2px)":"translateY(0)",
                    transition:"opacity 0.15s,border-color 0.1s,transform 0.1s",
                  }}>
                  {/* Card header row */}
                  <div style={{display:"flex",alignItems:"center",padding:"14px 14px 14px 10px"}}>
                    <span
                      style={{fontSize:16,color:isDragging?"#c8f72c":"#2e2e2e",padding:"6px 8px",flexShrink:0,cursor:"grab",userSelect:"none"}}
                      onTouchStart={e=>startLongPress(i,e)}
                      onTouchEnd={cancelLongPress}
                      onMouseDown={e=>e.stopPropagation()}>⠿</span>
                    <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}
                      onClick={()=>{ prevScreen.current="day"; setViewSid({mId:s.mId,eId:s.eId,sid:s.id}); setScreen("exercise"); }}>
                      <MuscleIcon muscle={s.mName} size={38}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:14}}>{s.eName}</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:3}}>
                          {s.mName} · {s.sets.length} sets{maxW>0?` · Max ${maxW}kg`:""}
                          {vol>0?` · ${vol}kg vol`:""}
                        </div>
                        {s.note&&<div style={{fontSize:11,color:"#3a5818",marginTop:3,fontStyle:"italic"}}>"{s.note}"</div>}
                      </div>
                    </div>
                    {/* Expand toggle */}
                    <button style={{...dBtn,fontSize:13,color:"#555",padding:"4px 6px"}}
                      onClick={e=>{e.stopPropagation();setExpandedDay(isExpanded?null:s.id);}}
                      onMouseEnter={ev=>ev.currentTarget.style.color=C.text}
                      onMouseLeave={ev=>ev.currentTarget.style.color=isExpanded?C.text:"#2a2a2a"}>
                      {isExpanded?"▲":"▼"}
                    </button>
                    <button style={dBtn}
                      onClick={e=>{e.stopPropagation();setModal({type:"confirm",msg:"Delete this exercise?",onOk:()=>delSession(s.mId,s.eId,s.id)});}}
                      onMouseEnter={e=>e.currentTarget.style.color="#cc2222"}
                      onMouseLeave={e=>e.currentTarget.style.color="#252525"}>✕</button>
                  </div>
                  {/* Inline expanded sets */}
                  {isExpanded&&s.sets.length>0&&(
                    <div style={{borderTop:"1px solid #161616",background:"#0a0a0a",padding:"8px 14px 10px"}}>
                      {s.sets.map((t,ti)=>(
                        <div key={t.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:ti<s.sets.length-1?"1px solid #111":"none"}}>
                          <span style={{fontSize:9,color:"#2a2a2a",width:22,flexShrink:0}}>S{ti+1}</span>
                          {t.type==="super"
                            ?<span style={{fontSize:12,color:"#888"}}>Super · {t.superSets?.length||0} ex</span>
                            :<>
                              {t.weight!=null&&<><span style={{fontSize:14,fontWeight:700,color:C.text}}>{t.weight}</span><span style={{fontSize:9,color:C.dim}}>kg ×</span></>}
                              <span style={{fontSize:14,fontWeight:700,color:C.text}}>{t.reps}</span>
                              <span style={{fontSize:9,color:C.dim}}>reps</span>
                            </>
                          }
                          {t.type!=="normal"&&<span style={{fontSize:8,color:"#555",marginLeft:2,background:"#181818",borderRadius:4,padding:"1px 5px"}}>{t.type}</span>}
                          <span style={{marginLeft:"auto",fontSize:10,color:"#243810"}}>
                            {t.weight!=null&&t.reps?`${Math.round(t.weight*t.reps)}kg`:""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <FloatBtn label="＋  Add Exercise" onClick={()=>setWizard({step:"muscle",date:viewDay})} visible={true}/>
      </div>
    );
  }

  // ── EXERCISE HISTORY (from sidebar tap) ──────────────────
  function ExerciseHistory(){
    const {mId,eId}=viewEx||{};
    const muscle=getMuscle(mId);
    const exer  =getEx(mId,eId);
    // Hooks must come before any early return
    const [selPt, setSelPt] = useState(null);
    const exSvgRef = useRef(null);
    // Guard: if data not ready yet, show loading
    if(!mId||!eId||!exer) return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={hdr}>
          <button style={bkBtn} onClick={()=>setScreen("home")}>← Back</button>
          <div style={{flex:1,minWidth:0}}><div style={ttl}>Exercise</div></div>
        </div>
        <div style={mpt}>Loading…</div>
      </div>
    );
    const sessions=sortSess(exer.sessions).map(s=>({...s,mId,mName:muscle?.name,eName:exer.name,eId}));

    const last30 = [...sessions].reverse().slice(-30);
    const graphPts = last30.map((s,i)=>{
      const ws = s.sets.filter(t=>t.weight!=null);
      const kg = ws.length ? Math.max(...ws.map(t=>t.weight)) : null;
      return kg!=null ? {date:s.date, kg, idx:i, total:last30.length} : null;
    }).filter(Boolean);

    const GW=320, GH=180, GP={top:16,right:16,bottom:40,left:44};
    const gPlotW=GW-GP.left-GP.right;
    const gPlotH=GH-GP.top-GP.bottom;
    const gVals=graphPts.map(p=>p.kg);
    const gMin=gVals.length?Math.floor(Math.min(...gVals)-1):0;
    const gMax=gVals.length?Math.ceil(Math.max(...gVals)+1):100;
    const gRange=gMax-gMin||1;
    const nPts=Math.max(last30.length-1,1);

    function gX(idx){ return GP.left+(idx/nPts)*gPlotW; }
    function gY(kg){ return GP.top+gPlotH-((kg-gMin)/gRange)*gPlotH; }

    const gLine=graphPts.map(p=>`${gX(p.idx)},${gY(p.kg)}`).join(" ");
    const gArea=graphPts.length>=2
      ?`${gX(graphPts[0].idx)},${GP.top+gPlotH} `+gLine+` ${gX(graphPts[graphPts.length-1].idx)},${GP.top+gPlotH}`
      :"";

    const gYTicks=(()=>{
      const rng=gRange; const step=rng<=10?1:rng<=20?2:rng<=50?5:10;
      const ticks=[];
      for(let v=Math.ceil(gMin/step)*step;v<=gMax;v+=step) ticks.push(v);
      return ticks;
    })();

    const gXLabels=(()=>{
      if(graphPts.length===0) return [];
      const labels=[];
      const showIdxs=graphPts.length<=5
        ?graphPts.map((_,i)=>i)
        :[0,Math.floor(graphPts.length*0.25),Math.floor(graphPts.length*0.5),Math.floor(graphPts.length*0.75),graphPts.length-1];
      [...new Set(showIdxs)].forEach(i=>{
        if(graphPts[i]) labels.push({idx:graphPts[i].idx, label:new Date(graphPts[i].date).toLocaleDateString("en-US",{month:"short",day:"numeric"})});
      });
      return labels;
    })();

    function handleExGraphClick(e){
      if(!exSvgRef.current||graphPts.length===0) return;
      const rect=exSvgRef.current.getBoundingClientRect();
      const mx=(e.clientX-rect.left)*(GW/rect.width);
      let best=null,bestDist=Infinity;
      graphPts.forEach(p=>{
        const d=Math.abs(gX(p.idx)-mx);
        if(d<bestDist){bestDist=d;best=p;}
      });
      if(best&&bestDist<40) setSelPt(sp=>sp?.date===best.date?null:best);
      else setSelPt(null);
    }

    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={{...hdr,borderBottom:"none"}}>
          <button style={bkBtn} onClick={()=>setScreen("home")}>← Back</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={ttl}>{exer.name}</div>
            <div style={sub}>{muscle?.name} · {exer.sessions.length} sessions</div>
          </div>
        </div>

        {/* ── Progress graph ── */}
        <div style={{background:"#0c0c0c",borderBottom:"1px solid #141414",padding:"12px 14px 14px",flexShrink:0}}>
          <div style={{fontSize:9,color:"#3a3a3a",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>
            Max Weight · Last {Math.min(sessions.length,30)} Sessions
          </div>

          {/* Selected point card */}
          {selPt?(
            <div style={{background:"#0d1400",border:"1px solid #1e3000",borderRadius:8,padding:"8px 12px",
              marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:22,fontWeight:700,color:C.green,letterSpacing:-1}}>{selPt.kg}<span style={{fontSize:10,color:"#4a7a00",fontWeight:400}}> kg</span></div>
              <div>
                <div style={{fontSize:11,color:C.text,fontWeight:600}}>{new Date(selPt.date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                <div style={{fontSize:9,color:"#4a6a00",marginTop:1,letterSpacing:1}}>tap again to deselect</div>
              </div>
            </div>
          ):graphPts.length>0?(
            <div style={{fontSize:9,color:"#2a2a2a",letterSpacing:1,marginBottom:10,textAlign:"center",textTransform:"uppercase"}}>
              tap graph to inspect a point
            </div>
          ):null}

          {graphPts.length>=2?(
            <div style={{background:"#090909",border:"1px solid #1a1a1a",borderRadius:10,overflow:"hidden",padding:"6px 0 2px"}}>
              <svg ref={exSvgRef} viewBox={`0 0 ${GW} ${GH}`} width="100%"
                style={{display:"block",cursor:"crosshair",touchAction:"none"}}
                onClick={handleExGraphClick}>
                {/* Grid */}
                {gYTicks.map(v=>(
                  <line key={v} x1={GP.left} x2={GP.left+gPlotW} y1={gY(v)} y2={gY(v)} stroke="#1a1a1a" strokeWidth="1"/>
                ))}
                {/* Area */}
                {gArea&&<polygon points={gArea} fill="#c8f72c" fillOpacity="0.07"/>}
                {/* Line */}
                <polyline points={gLine} fill="none" stroke="#c8f72c" strokeWidth="2"
                  strokeLinejoin="round" strokeLinecap="round"/>
                {/* Dots */}
                {graphPts.map(p=>{
                  const isSel=selPt?.date===p.date;
                  return(
                    <g key={p.date}>
                      {isSel&&<circle cx={gX(p.idx)} cy={gY(p.kg)} r="10" fill="#c8f72c" fillOpacity="0.15"/>}
                      <circle cx={gX(p.idx)} cy={gY(p.kg)} r={isSel?5:3}
                        fill={isSel?"#c8f72c":"#8aaa40"} stroke="#090909" strokeWidth="1.5"/>
                    </g>
                  );
                })}
                {/* Selected vertical line */}
                {selPt&&<line x1={gX(selPt.idx)} x2={gX(selPt.idx)}
                  y1={GP.top} y2={GP.top+gPlotH}
                  stroke="#c8f72c" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5"/>}
                {/* Y labels */}
                {gYTicks.map(v=>(
                  <text key={v} x={GP.left-5} y={gY(v)+4} textAnchor="end"
                    fill="#3a3a3a" fontSize="9" fontFamily="monospace">{v}</text>
                ))}
                {/* X labels */}
                {gXLabels.map(({idx,label})=>(
                  <text key={idx} x={gX(idx)} y={GH-6} textAnchor="middle"
                    fill="#3a3a3a" fontSize="8" fontFamily="monospace">{label}</text>
                ))}
                <line x1={GP.left} x2={GP.left} y1={GP.top} y2={GP.top+gPlotH} stroke="#2a2a2a" strokeWidth="1"/>
                <line x1={GP.left} x2={GP.left+gPlotW} y1={GP.top+gPlotH} y2={GP.top+gPlotH} stroke="#2a2a2a" strokeWidth="1"/>
              </svg>
            </div>
          ):sessions.length>0?(
            <div style={{textAlign:"center",padding:"20px 0",fontSize:9,color:"#2a2a2a",letterSpacing:2,textTransform:"uppercase"}}>
              Log weight in sets to see progress
            </div>
          ):null}

          {/* Summary strip */}
          {graphPts.length>=2&&(()=>{
            const diff=(graphPts[graphPts.length-1].kg-graphPts[0].kg).toFixed(1);
            const diffColor=parseFloat(diff)>0?C.green:parseFloat(diff)<0?"#e85d2a":C.muted;
            return(
              <div style={{display:"flex",gap:8,marginTop:10}}>
                {[
                  {label:"Best",value:`${Math.max(...gVals)}kg`},
                  {label:"Progress",value:`${diff>0?"+":""}${diff}kg`,color:diffColor},
                  {label:"Sessions",value:graphPts.length},
                ].map(st=>(
                  <div key={st.label} style={{flex:1,background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:6,padding:"7px 4px",textAlign:"center"}}>
                    <div style={{fontSize:13,fontWeight:700,color:st.color||C.text}}>{st.value}</div>
                    <div style={{fontSize:7,color:"#3a3a3a",letterSpacing:2,textTransform:"uppercase",marginTop:2}}>{st.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        <div ref={scrollRef} style={{flex:1,overflowY:"auto",paddingBottom:110}}>
          {sessions.length===0&&<div style={mpt}>No sessions yet<br/>Tap Record Session to start</div>}
          {sessions.map((s,i)=>{
            const maxW=s.sets.filter(t=>t.weight!=null).length?Math.max(...s.sets.filter(t=>t.weight!=null).map(t=>t.weight)):0;
            const vol =s.sets.filter(t=>t.weight!=null).reduce((a,t)=>a+t.weight*t.reps,0);
            return(
              <div key={s.id} style={crd}
                onClick={()=>{ prevScreen.current="exHistory"; setViewSid({mId,eId,sid:s.id}); setScreen("exercise"); }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#2a2a2a"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <div style={{fontWeight:600,fontSize:14}}>{fmtDate(s.date)}</div>
                    {i===0&&<span style={{background:"#1a2a00",border:"1px solid #2a4400",borderRadius:20,padding:"1px 8px",fontSize:10,color:"#9cc018",letterSpacing:1}}>Latest</span>}
                  </div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                    {s.sets.length} sets{maxW>0?` · Max ${maxW}kg`:""}
                    {vol>0?` · Vol ${vol}kg`:""}
                  </div>
                  {s.note&&<div style={{fontSize:11,color:"#3a5818",marginTop:3,fontStyle:"italic"}}>"{s.note}"</div>}
                </div>
                <button style={dBtn}
                  onClick={e=>{e.stopPropagation();setModal({type:"confirm",msg:`Delete session from ${fmtDate(s.date)}?`,onOk:()=>delSession(mId,eId,s.id)});}}
                  onMouseEnter={e=>e.currentTarget.style.color="#cc2222"}
                  onMouseLeave={e=>e.currentTarget.style.color="#252525"}>✕</button>
              </div>
            );
          })}

        </div>
        <FloatBtn label="＋  Record Session" onClick={()=>setWizard({step:"muscle",date:new Date().toISOString().slice(0,10)})} visible={fabVisible}/>
      </div>
    );
  }

  // ── EXERCISE DETAIL (sets for one session) ────────────────
  function ExerciseDetail(){
    const {mId,eId,sid}=viewSid||{};
    const muscle  = getMuscle(mId);
    const exer    = getEx(mId,eId);
    const session = getSess(mId,eId,sid);
    if(!session) return null;
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={hdr}>
          <button style={bkBtn} onClick={()=>setScreen(prevScreen.current)}>← Back</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={ttl}>{exer?.name}</div>
            <div style={sub}>{muscle?.name} · {fmtDate(session.date)}</div>
          </div>
        </div>
        <StatsBar sets={session.sets}/>
        <TimerBar sid={sid}/>
        <div ref={scrollRef} style={{flex:1,overflowY:"auto",paddingBottom:110}}>
          <div style={sLbl}>Sets</div>
          <SetList sets={session.sets} mId={mId} eId={eId} sid={sid}/>
        </div>
        <FloatBtn label="+ Log Set" onClick={()=>setModal({type:"addSet",mId,eId,sid})} visible={true} left/>
      </div>
    );
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

  function LockScreen() {
    const [tab,      setTab]    = useState("code");
    const [input,    setInput]  = useState("");
    const [err,      setErr]    = useState(null);
    const [scanning, setScanning] = useState(false);
    const [jsqrReady, setJsqrReady] = useState(!!window.jsQR);
    const videoRef   = useRef(null);
    const streamRef  = useRef(null);
    const timerRef   = useRef(null);
    const canvasRef  = useRef(document.createElement("canvas"));

    // Load jsQR once
    useEffect(() => {
      if (window.jsQR) { setJsqrReady(true); return; }
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
      s.onload = () => setJsqrReady(true);
      document.head.appendChild(s);
      return () => { stopScan(); };
    }, []);

    function tryUnlock(token) {
      const parsed = parseToken(token);
      if (!parsed) { setErr("Invalid code. Make sure you copied the full code from KeyGen."); return; }
      if (parsed.expMs <= Date.now()) { setErr("This code has expired. Generate a new one in KeyGen."); return; }
      doUnlock(new Date(parsed.expMs).toISOString());
    }

    function tryCode() {
      tryUnlock(input);
    }

    function stopScan() {
      clearInterval(timerRef.current);
      timerRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setScanning(false);
    }

    async function startScan() {
      setErr(null);
      setScanning(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal:"environment" }, width:{ideal:1280}, height:{ideal:720} }
        });
        streamRef.current = stream;
        await new Promise(r => setTimeout(r, 150)); // wait for video element
        const video = videoRef.current;
        if (!video) { stopScan(); return; }
        video.srcObject = stream;
        video.setAttribute("playsinline","true");
        video.muted = true;
        await video.play();

        timerRef.current = setInterval(() => {
          if (!videoRef.current || !streamRef.current) return;
          const v = videoRef.current;
          if (v.readyState < v.HAVE_ENOUGH_DATA || !v.videoWidth) return;

          const canvas = canvasRef.current;
          // Decode at 400px wide — good balance of speed and accuracy
          const scale = Math.min(1, 400 / v.videoWidth);
          canvas.width  = Math.round(v.videoWidth  * scale);
          canvas.height = Math.round(v.videoHeight * scale);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

          if (!window.jsQR) return;
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qr  = window.jsQR(img.data, img.width, img.height, { inversionAttempts:"dontInvert" });
          if (qr?.data) {
            stopScan();
            tryUnlock(qr.data);
          }
        }, 200); // scan 5× per second

      } catch(e) {
        const denied = e.name==="NotAllowedError" || e.name==="PermissionDeniedError";
        setErr(denied
          ? "Camera denied. Go to Android Settings → Apps → GymLog → Permissions → Camera → Allow."
          : `Camera error: ${e.message||e.name}`);
        setScanning(false);
      }
    }

    const inp2 = {
      background:"#0d0d0d", border:"1px solid #252525", borderRadius:10,
      color:C.text, padding:"14px", fontSize:13, ...T, outline:"none",
      width:"100%", textAlign:"center",
    };

    const exp = getUnlockExp();
    const expDt = exp ? new Date(exp) : null;
    const stillValid = expDt && expDt > new Date();

    return (
      <div style={{height:"100vh",background:C.bg,color:C.text,...T,fontSize:14,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        padding:"0 24px",overflowY:"auto"}}>
        <style>{`input:focus{border-color:#c8f72c!important;outline:none;}`}</style>

        <div style={{marginBottom:28,textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:10}}>🔒</div>
          <div style={{fontSize:22,fontWeight:700,color:C.green,letterSpacing:3}}>GymLog</div>
          <div style={{fontSize:10,color:"#3a3a3a",letterSpacing:2,marginTop:6,textTransform:"uppercase"}}>
            Enter access code to continue
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",marginBottom:18,background:"#111",
          border:"1px solid #1e1e1e",borderRadius:10,overflow:"hidden",width:"100%",maxWidth:320}}>
          {[["code","📋 Code"],["qr","📷 Scan QR"]].map(([t,label])=>(
            <button key={t} onClick={()=>{setTab(t);setErr(null);if(t!=="qr")stopScan();}}
              style={{flex:1,padding:"12px",border:"none",cursor:"pointer",...T,
                fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",
                background:tab===t?C.green:"transparent",
                color:tab===t?"#000":"#555"}}>
              {label}
            </button>
          ))}
        </div>

        <div style={{width:"100%",maxWidth:320}}>
          {tab==="code"?(
            <>
              <div style={{position:"relative"}}>
                <input
                  style={{...inp2,letterSpacing:input.trim().length>0?6:1,
                    fontSize:input.trim().length>0?18:13,
                    textAlign:"center",fontWeight:input.trim().length>0?700:"normal"}}
                  type="password"
                  placeholder="Paste access code"
                  value={input}
                  onChange={e=>{ setInput(e.target.value); setErr(null); }}
                  onKeyDown={e=>{ if(e.key==="Enter") tryCode(); }}
                  autoCorrect="off"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  spellCheck="false"
                />
                {input.length>0&&(
                  <button onClick={()=>{setInput("");setErr(null);}}
                    style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                      background:"none",border:"none",color:"#3a3a3a",fontSize:14,cursor:"pointer",...T,
                      padding:"4px"}}>
                    ✕
                  </button>
                )}
              </div>
              <button onClick={tryCode}
                style={{width:"100%",padding:"15px",marginTop:10,borderRadius:10,border:"none",
                  background:input.trim().length>5?C.green:"#181818",
                  color:input.trim().length>5?"#000":"#3a3a3a",
                  fontSize:13,fontWeight:700,letterSpacing:2,
                  cursor:"pointer",textTransform:"uppercase",...T}}>
                Unlock GymLog
              </button>
            </>
          ):(
            <>
              {!scanning?(
                <button onClick={startScan}
                  style={{width:"100%",padding:"28px 20px",borderRadius:12,
                    border:`2px dashed ${jsqrReady?"#2a2a2a":"#1a1a1a"}`,
                    background:"#0d0d0d",color:jsqrReady?"#666":"#333",
                    fontSize:12,cursor:"pointer",...T,
                    display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                  <span style={{fontSize:36}}>📷</span>
                  <span>{jsqrReady?"Tap to scan QR code":"Loading scanner..."}</span>
                  <span style={{fontSize:9,color:"#2a2a2a"}}>Point camera at QR from KeyGen app</span>
                </button>
              ):(
                <div style={{position:"relative",borderRadius:12,overflow:"hidden",
                  border:"2px solid #c8f72c",aspectRatio:"1",background:"#000"}}>
                  <video ref={videoRef}
                    style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                    playsInline muted autoPlay/>
                  {/* Aiming reticle */}
                  <div style={{position:"absolute",inset:0,display:"flex",
                    alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                    <div style={{width:"55%",height:"55%",border:"2px solid #c8f72c",
                      borderRadius:8,boxShadow:"0 0 0 9999px rgba(0,0,0,0.45)"}}/>
                  </div>
                  <button onClick={stopScan}
                    style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.75)",
                      border:"none",color:"#fff",borderRadius:6,padding:"6px 10px",
                      cursor:"pointer",...T,fontSize:11}}>
                    ✕
                  </button>
                  <div style={{position:"absolute",bottom:8,left:0,right:0,
                    textAlign:"center",fontSize:9,color:"rgba(200,247,44,0.7)",letterSpacing:1}}>
                    SCANNING...
                  </div>
                </div>
              )}
            </>
          )}

          {err&&(
            <div style={{marginTop:12,padding:"10px 14px",background:"#1a0000",
              border:"1px solid #3a0000",borderRadius:8,fontSize:11,color:"#e85d2a",
              textAlign:"center",lineHeight:1.5}}>
              {err}
            </div>
          )}
        </div>

        <div style={{marginTop:28,fontSize:9,color:"#252525",letterSpacing:1.5,
          textAlign:"center",lineHeight:1.8,maxWidth:300}}>
          {stillValid
            ? <>ACCESS ACTIVE UNTIL {expDt.toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).toUpperCase()}</>
            : <>CONTACT ADMIN FOR ACCESS CODE · USE GYMLOG KEYGEN APP</>
          }
        </div>
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────
  // ── RENDER ────────────────────────────────────────────────
  if (locked) return <LockScreen/>;
  return(
    <div style={{height:"100vh",background:C.bg,color:C.text,...T,fontSize:14,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.4);cursor:pointer;}
        input[type=number]{-moz-appearance:textfield;}
        input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:#0a0a0a;}
        ::-webkit-scrollbar-thumb{background:#181818;border-radius:2px;}
        input:focus{border-color:#2a4200!important;}
        button:active{opacity:0.75;}
      `}</style>

      {sidebar&&<Sidebar/>}
      {anatomyOpen&&<AnatomyModal/>}
      {bwOpen&&<BodyWeightModal onClose={()=>setBwOpen(false)}/>}
      {stepsOpen&&<StepsGraphModal onClose={()=>setStepsOpen(false)}/>}
      {calOpen&&<CalendarOverlay/>}

      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {wizard
          ? <Wizard/>
          : screen==="exercise"
            ? <ExerciseDetail/>
            : screen==="exHistory"
              ? <ExerciseHistory/>
              : screen==="day"
                ? <DayDetail/>
                : <Home/>
        }
      </div>

      {modal?.type==="addMuscle"&&<NameModal title="Add Muscle Group" ph="e.g. Glutes, Forearms…" onAdd={addMuscle}/>}
      {modal?.type==="addUser"   &&<NameModal title="Add User" ph="e.g. Alex, Sarah…" onAdd={addUser}/>}
      {modal?.type==="addEx"    &&<NameModal title="Add Exercise" ph="e.g. Bench Press, Squat…" onAdd={n=>addEx(modal.mId,n)} checkDupe={n=>getMuscle(modal.mId)?.exercises.some(e=>e.name.trim().toLowerCase()===n.trim().toLowerCase())}/>}
      {modal?.type==="editEx"   &&<EditExModal mId={modal.mId} eId={modal.eId} current={modal.current}/>}
      {modal?.type==="addSet"   &&<SetModal mId={modal.mId} eId={modal.eId} sid={modal.sid}/>}
      {modal?.type==="editSet"  &&<EditSetModal mId={modal.mId} eId={modal.eId} sid={modal.sid} set={modal.set}/>}
      {modal?.type==="confirm"  &&<ConfirmModal msg={modal.msg} onOk={modal.onOk}/>}
      {modal?.type==="dayWeight" &&<DayWeightModal date={modal.date}/>}
      {modal?.type==="daySteps"  &&<DayStepsModal  date={modal.date}/>}
    </div>
  );
}
