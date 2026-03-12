import React, { useState, useEffect, useRef, useCallback } from "react";

// Storage: WebView localStorage, physical path on Android:
// /data/data/com.gymlog.app/app_webview/Default/Local Storage/leveldb/
// Access via Android Studio → View → Tool Windows → Device File Explorer
const STORAGE_KEY = "gymlog/v5/data";

// ── Default first user ───────────────────────────────────────
function makeDefaultUser(name="Me"){
  return { id: uid0(), name, muscles: DEFAULT_MUSCLES.map(m=>({...m,exercises:m.exercises.map(e=>({...e,sessions:[]})) })) };
}
function uid0(){ return Math.random().toString(36).slice(2,10)+Date.now().toString(36); }

// ── Anatomical icons ────────────────────────────────────────
const MuscleIcon = ({ muscle, size = 48 }) => {
  const G="#4a4a4a", D="#333", R="#e8341a", S="#c42a12";
  const Base = ({children}) => (
    <svg viewBox="0 0 64 80" width={size} height={size}>
      <ellipse cx="32" cy="7" rx="5" ry="6" fill={G}/>
      <rect x="29" y="12" width="6" height="5" fill={G}/>
      {children}
      <path d="M14 17 Q8 20 8 32 L10 44 Q12 46 14 44 L16 32 Z" fill={G}/>
      <path d="M50 17 Q56 20 56 32 L54 44 Q52 46 50 44 L48 32 Z" fill={G}/>
      <path d="M14 54 L20 54 L22 72 L18 72 Z" fill={G}/>
      <path d="M44 54 L50 54 L46 72 L42 72 Z" fill={G}/>
      <path d="M26 54 L32 54 L32 72 L26 72 Z" fill={G}/>
      <path d="M32 54 L38 54 L38 72 L32 72 Z" fill={G}/>
    </svg>
  );
  const torso = <path d="M18 17 Q14 20 14 30 L14 54 L50 54 L50 30 Q50 20 46 17Z" fill={D}/>;
  const icons = {
    Chest:    <Base>{torso}<path d="M18 17 Q14 20 14 32 L32 30Z" fill={R}/><path d="M46 17 Q50 20 50 32 L32 30Z" fill={R}/><line x1="32" y1="17" x2="32" y2="32" stroke={S} strokeWidth="1"/></Base>,
    Back:     <Base>{torso}<path d="M22 17 Q32 13 42 17 Q38 24 32 22 Q26 24 22 17Z" fill={R}/><path d="M14 20 Q14 38 20 42 L28 38 L24 20Z" fill={R}/><path d="M50 20 Q50 38 44 42 L36 38 L40 20Z" fill={R}/></Base>,
    Legs:     <Base>{torso}<path d="M14 54 L20 54 L22 72 L18 72Z" fill={R}/><path d="M44 54 L50 54 L46 72 L42 72Z" fill={R}/><path d="M26 54 L32 54 L32 72 L26 72Z" fill={R} opacity="0.8"/><path d="M32 54 L38 54 L38 72 L32 72Z" fill={R} opacity="0.8"/></Base>,
    Shoulders:<Base>{torso}<path d="M14 17 Q8 20 8 32 L10 44 Q12 46 14 44 L16 32Z" fill={R}/><path d="M50 17 Q56 20 56 32 L54 44 Q52 46 50 44 L48 32Z" fill={R}/><path d="M22 17 Q32 13 42 17 L44 22 Q32 19 20 22Z" fill={R}/></Base>,
    Biceps:   <Base>{torso}<path d="M14 17 Q8 20 8 32 L10 44 Q12 46 14 44 L16 32Z" fill={G}/><ellipse cx="11" cy="28" rx="4" ry="7" fill={R}/><path d="M50 17 Q56 20 56 32 L54 44 Q52 46 50 44 L48 32Z" fill={G}/><ellipse cx="53" cy="28" rx="4" ry="7" fill={R}/></Base>,
    Triceps:  <Base>{torso}<path d="M14 17 Q8 20 8 32 L10 44 Q12 46 14 44 L16 32Z" fill={G}/><path d="M8 22 Q5 30 8 38 Q12 42 15 38 Q13 30 13 22Z" fill={R}/><path d="M50 17 Q56 20 56 32 L54 44 Q52 46 50 44 L48 32Z" fill={G}/><path d="M56 22 Q59 30 56 38 Q52 42 49 38 Q51 30 51 22Z" fill={R}/></Base>,
    Abs:      <Base>{torso}<rect x="25" y="28" width="6" height="5" rx="1.5" fill={R}/><rect x="33" y="28" width="6" height="5" rx="1.5" fill={R}/><rect x="25" y="35" width="6" height="5" rx="1.5" fill={R}/><rect x="33" y="35" width="6" height="5" rx="1.5" fill={R}/><rect x="25" y="42" width="6" height="4" rx="1.5" fill={R} opacity="0.8"/><rect x="33" y="42" width="6" height="4" rx="1.5" fill={R} opacity="0.8"/><line x1="32" y1="26" x2="32" y2="48" stroke={S} strokeWidth="1"/></Base>,
  };
  return icons[muscle] || <Base>{torso}<ellipse cx="32" cy="34" rx="8" ry="10" fill={R} opacity="0.7"/></Base>;
};

// ── Default data ─────────────────────────────────────────────
const DEFAULT_MUSCLES = [
  { id:"m1", name:"Chest", lastEdited:1000, exercises:[
    "Barbell Bench Press","Incline Barbell Bench Press","Decline Barbell Bench Press",
    "Reverse Grip Bench Press","Close Grip Bench Press","Dumbbell Bench Press",
    "Incline Dumbbell Press","Decline Dumbbell Press","Dumbbell Fly","Incline Dumbbell Fly",
    "Decline Dumbbell Fly","Dumbbell Pullover","Smith Machine Bench Press",
    "Smith Machine Incline Press","Smith Machine Decline Press","Cable Fly (High to Low)",
    "Cable Fly (Low to High)","Cable Fly (Mid)","Pec Deck Machine","Chest Press Machine",
    "Plate Loaded Chest Press","Push-ups","Wide Push-ups","Decline Push-ups","Weighted Push-ups","Chest Dips"
  ].map((name,i)=>({id:`e1_${i}`,name,sessions:[],lastEdited:1000+i}))},
  { id:"m2", name:"Back", lastEdited:999, exercises:[
    "Deadlift","Romanian Deadlift","Stiff Leg Deadlift","Barbell Row","Pendlay Row",
    "Rack Pull","Meadows Row","Single Arm Dumbbell Row","Dumbbell Row","Incline Bench Dumbbell Row",
    "Smith Machine Row","Lat Pulldown","Wide Grip Pulldown","Close Grip Pulldown",
    "Reverse Grip Pulldown","Seated Cable Row","Straight Arm Pulldown","Face Pull",
    "Pull-ups","Weighted Pull-ups","Chin-ups"
  ].map((name,i)=>({id:`e2_${i}`,name,sessions:[],lastEdited:999+i}))},
  { id:"m3", name:"Legs", lastEdited:998, exercises:[
    "Barbell Squat","Front Squat","Romanian Deadlift","Stiff Leg Deadlift","Good Mornings",
    "Barbell Hip Thrust","Dumbbell Squat","Goblet Squat","Walking Lunges","Reverse Lunges",
    "Bulgarian Split Squat","Step Ups","Smith Machine Squat","Smith Machine Lunges",
    "Smith Machine Hip Thrust","Leg Press","Hack Squat","Leg Extension",
    "Leg Curl (Lying)","Leg Curl (Seated)","Standing Calf Raise","Seated Calf Raise",
    "Leg Press Calf Raise","Donkey Calf Raise"
  ].map((name,i)=>({id:`e3_${i}`,name,sessions:[],lastEdited:998+i}))},
  { id:"m4", name:"Shoulders", lastEdited:997, exercises:[
    "Barbell Overhead Press","Seated Barbell Press","Push Press","Behind the Neck Press",
    "Upright Row","Dumbbell Shoulder Press","Arnold Press","Dumbbell Lateral Raise",
    "Dumbbell Front Raise","Rear Delt Fly","Dumbbell Shrugs","Smith Machine Shoulder Press",
    "Smith Machine Upright Row","Smith Machine Shrugs","Cable Lateral Raise","Cable Front Raise",
    "Cable Rear Delt Fly","Machine Shoulder Press","Machine Lateral Raise","Reverse Pec Deck"
  ].map((name,i)=>({id:`e4_${i}`,name,sessions:[],lastEdited:997+i}))},
  { id:"m5", name:"Biceps", lastEdited:996, exercises:[
    "Barbell Curl","EZ Bar Curl","Reverse Curl","Alternating Dumbbell Curl","Hammer Curl",
    "Incline Dumbbell Curl","Concentration Curl","Zottman Curl","Cable Curl","Rope Cable Curl",
    "Preacher Curl Machine","Cable Single Arm Curl"
  ].map((name,i)=>({id:`e5_${i}`,name,sessions:[],lastEdited:996+i}))},
  { id:"m6", name:"Triceps", lastEdited:995, exercises:[
    "Skull Crushers","JM Press","Overhead Dumbbell Extension","Seated Overhead Extension",
    "Dumbbell Skull Crushers","Tricep Kickbacks","Cable Pushdown","Rope Pushdown",
    "Reverse Grip Pushdown","Cable Overhead Extension","Single Arm Pushdown",
    "Bench Dips","Parallel Bar Dips","Weighted Dips"
  ].map((name,i)=>({id:`e6_${i}`,name,sessions:[],lastEdited:995+i}))},
  { id:"m7", name:"Abs", lastEdited:994, exercises:[
    "Crunches","Weighted Crunch","Cable Crunch","Decline Sit-ups","Hanging Leg Raise",
    "Hanging Knee Raise","Reverse Crunch","Russian Twist","Weighted Russian Twist",
    "Plank","Side Plank","Ab Wheel Rollout","V-Ups","Toe Touches","Mountain Climbers"
  ].map((name,i)=>({id:`e7_${i}`,name,sessions:[],lastEdited:994+i}))},
];

function uid(){ return Math.random().toString(36).slice(2,10)+Date.now().toString(36); }
function fmtDate(iso){ return new Date(iso).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}); }
function initData(){
  try{
    const s=localStorage.getItem(STORAGE_KEY);
    if(s){
      const d=JSON.parse(s);
      // migrate old format (has muscles at top level)
      if(d.muscles&&!d.users){
        const u={id:uid(),name:"Me",muscles:d.muscles};
        return {users:[u],activeUserId:u.id};
      }
      return d;
    }
  }catch{}
  const u=makeDefaultUser("Me");
  return {users:[u],activeUserId:u.id};
}

function getAllSessions(muscles){
  const out=[];
  muscles.forEach(m=>m.exercises.forEach(e=>e.sessions.forEach(s=>
    out.push({...s,mId:m.id,mName:m.name,eName:e.name,eId:e.id})
  )));
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

export default function App(){
  const [data,    setData]    = useState(initData);
  const [screen,  setScreen]  = useState("home");
  const [viewDay, setViewDay] = useState(null);
  const [viewSid, setViewSid] = useState(null);
  const [viewEx,  setViewEx]  = useState(null);
  const [wizard,  setWizard]  = useState(null);
  const [sidebar, setSidebar] = useState(false);
  const [anatomyOpen, setAnatomyOpen] = useState(false);
  const [modal,   setModal]   = useState(null);
  const [sbOpen,  setSbOpen]  = useState({});
  const [calOpen, setCalOpen] = useState(false);  // calendar overlay
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

  const capApp   = useRef(null);   // Capacitor App plugin ref for minimizeApp
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
  },[modal,sidebar,calOpen,anatomyOpen,wizard,screen,viewDay,viewEx]);

  function handleBack(){
    if(modal){setModal(null);return;}
    if(calOpen){setCalOpen(false);return;}
    if(sidebar){setSidebar(false);return;}
    if(anatomyOpen){setAnatomyOpen(false);setScreen("home");return;}
    if(wizard){
      const {step}=wizard;
      if(step==="sets")        {setWizard(w=>({...w,step:"exercise"}));return;}
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
        <input
          type="number"
          autoFocus
          style={{...inp,marginBottom:0,paddingRight:44,fontSize:22,textAlign:"center",color:C.green,fontWeight:700}}
          placeholder="0.0"
          value={val}
          onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") doSave(); }}
        />
        <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#555",...T}}>kg</span>
      </div>
      <div style={rw}>
        {existing!=null&&<button style={{...btn(false,true),flex:"0 0 auto",padding:"14px 18px",fontSize:11}} onMouseDown={e=>{e.stopPropagation();doClear();}}>Clear</button>}
        <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
        <button style={btn(true,!val)} onMouseDown={e=>{e.stopPropagation();doSave();}}>Save</button>
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
    const [usersOpen,setUsersOpen]=useState(true);
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
          <button style={{...btn(false),display:"block",width:"100%",fontSize:15,padding:"14px",
            background:"#111",border:"1px solid #1e1e1e",color:"#c8f72c",borderRadius:8,fontWeight:700,letterSpacing:2,cursor:"pointer",...T}}
            onMouseDown={e=>{e.stopPropagation();setAnatomyOpen(true);}}>🫀 Human Anatomy</button>
          <button style={{...btn(true),display:"block",width:"100%",marginTop:8,fontSize:15,padding:"14px"}}
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

    if(step==="muscle") return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={hdr}>
          <button style={bkBtn} onClick={()=>setWizard(null)}>✕</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={ttl}>Record Session</div>
            <div style={sub}>Pick a muscle group</div>
          </div>
        </div>
        <div ref={wScrollRef} style={{flex:1,overflowY:"auto",paddingBottom:100}}>
          {/* ── Body weight card — once per day, optional ── */}
          {(()=>{
            const bw = dailyWeights[date];
            const logged = bw!=null;
            return (
              <div style={{...crd,
                borderColor: logged?"#1e3000":C.border,
                background: logged?"#0d1400":C.card,
                opacity: logged?1:0.7,
              }}
                onClick={()=>setModal({type:"dayWeight",date})}
                onMouseEnter={e=>e.currentTarget.style.borderColor=logged?"#2a4400":"#2a2a2a"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=logged?"#1e3000":C.border}>
                <div style={{width:44,height:44,borderRadius:10,background:logged?"#1a2e00":"#131313",
                  border:`1px solid ${logged?"#2a4400":"#1e1e1e"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                  🏋
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,color:logged?C.green:C.muted}}>
                    Body Weight
                  </div>
                  <div style={{fontSize:11,color:logged?"#4a7a00":C.muted,marginTop:3}}>
                    {logged?`${bw} kg — tap to edit`:"Optional · tap to log today's weight"}
                  </div>
                </div>
                <span style={{color:logged?C.green:"#2a2a2a",fontSize:logged?15:18,fontWeight:700}}>
                  {logged?"✓":"›"}
                </span>
              </div>
            );
          })()}
          {/* ── Separator ── */}
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
        </div>
        <FloatBtn label="✕  Cancel" onClick={()=>setWizard(null)} visible={fabVisible}/>
      </div>
    );

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
                autoFocus
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
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
          <div style={hdr}>
            <button style={bkBtn} onClick={()=>setWizard(w=>({...w,step:"exercise",sid:null}))}>← Back</button>
            <div style={{flex:1,minWidth:0}}>
              <div style={ttl}>{exer?.name}</div>
              <div style={sub}>{muscle?.name} · {fmtDate(date)}</div>
            </div>
          </div>
          <StatsBar sets={session.sets}/>
          <div ref={wScrollRef} style={{flex:1,overflowY:"auto",paddingBottom:110}}>
            <div style={{padding:"10px 14px"}}>
              {!editNote
                ?<div style={nBox} onClick={()=>{setEN(true);setNV(session.note);}}>
                  {session.note||<span style={{color:"#1c1c1c"}}>+ Add session note…</span>}
                </div>
                :<input style={{...inp,marginBottom:0}} autoFocus value={noteVal}
                  onChange={e=>setNV(e.target.value)}
                  onBlur={()=>{updateNote(mId,eId,sid,noteVal);setEN(false);}}
                  onKeyDown={e=>{if(e.key==="Enter"){updateNote(mId,eId,sid,noteVal);setEN(false);}}}/>
              }
            </div>
            <div style={sLbl}>Sets</div>
            <SetList sets={session.sets} mId={mId} eId={eId} sid={sid}/>
          </div>
          {/* Log Set on left, Done on right */}
          <FloatBtn label="+ Log Set" onClick={()=>setModal({type:"addSet",mId,eId,sid})} visible={fabVisible} left/>
          <FloatBtn label="Done ✓" onClick={()=>setWizard(null)} visible={fabVisible} right/>
        </div>
      );
    }
    return null;
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

    const cells = [];
    // Empty cells before first day
    for(let i=0;i<firstDay;i++) cells.push(null);
    for(let d=1;d<=daysInMonth;d++) cells.push(d);

    const pad = n=>String(n).padStart(2,"0");
    const dateStr = d=>`${yr}-${pad(mon+1)}-${pad(d)}`;

    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:100,display:"flex",flexDirection:"column",...T}}
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
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
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
    const days=groupByDay(getAllSessions(muscles));
    const PREVIEW=2;
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={hdr}>
          <button style={mnBtn} onClick={()=>setSidebar(true)}>☰</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={ttl}>GymLog</div>
            <div style={{...sub,fontSize:11,letterSpacing:1,color:"#555"}}>{activeUser?.name} · Push harder than yesterday 💪</div>
          </div>
          <button style={{...mnBtn,fontSize:18}} onClick={()=>setCalOpen(true)}>📅</button>
        </div>

        <div ref={scrollRef} style={{flex:1,overflowY:"auto",paddingBottom:110}}>
          {days.length===0&&<div style={mpt}>No sessions yet<br/>Tap Record Session to start</div>}
          {days.map(({date,sessions})=>{
            const totalSets=sessions.reduce((a,s)=>a+s.sets.length,0);
            const visible=sessions.slice(0,PREVIEW);
            const hidden=sessions.length-PREVIEW;
            const goToDay=()=>{ setViewDay(date); setScreen("day"); };
            return(
              <div key={date} style={{margin:"6px 14px",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",cursor:"pointer"}}
                onClick={goToDay}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#2a2a2a"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                {/* Day header */}
                <div style={{padding:"11px 14px 9px",borderBottom:"1px solid #161616",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontWeight:700,fontSize:13,color:C.text,letterSpacing:0.5}}>{fmtDate(date)}</div>
                  <div style={{fontSize:10,color:"#3a3a3a",letterSpacing:1}}>{sessions.length} exercise{sessions.length!==1?"s":""} · {totalSets} sets</div>
                </div>
                {/* Exercise rows — compact preview */}
                {visible.map((s,i)=>{
                  const maxW=s.sets.filter(t=>t.weight!=null).length?Math.max(...s.sets.filter(t=>t.weight!=null).map(t=>t.weight)):0;
                  return(
                    <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderTop:i>0?"1px solid #111":"none"}}>
                      <MuscleIcon muscle={s.mName} size={26}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#c0c0c0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.eName}</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:1}}>
                          {s.sets.length} sets{maxW>0?` · ${maxW}kg`:""}
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
              </div>
            );
          })}
        </div>

        <FloatBtn label="＋  Record Session" onClick={()=>setWizard({step:"muscle",date:new Date().toISOString().slice(0,10)})} visible={fabVisible}/>
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

    if(!localSessions.length||localSessions===undefined) return null;

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
          {/* ── Body weight card — big, not draggable ── */}
          {(()=>{
            const bw=dailyWeights[viewDay];
            const logged=bw!=null;
            return(
              <div style={{...crd,
                borderColor:logged?"#1e3000":C.border,
                background:logged?"#0d1400":C.card,
              }}
                onClick={()=>setModal({type:"dayWeight",date:viewDay})}
                onMouseEnter={e=>e.currentTarget.style.borderColor=logged?"#2a4400":"#2a2a2a"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=logged?"#1e3000":C.border}>
                <div style={{width:44,height:44,borderRadius:10,background:logged?"#1a2e00":"#131313",
                  border:`1px solid ${logged?"#2a4400":"#1e1e1e"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                  🏋
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,color:logged?C.green:C.muted}}>Body Weight</div>
                  <div style={{fontSize:11,color:logged?"#4a7a00":C.muted,marginTop:3}}>
                    {logged?`${bw} kg — tap to edit`:"Optional · tap to log today's weight"}
                  </div>
                </div>
                <span style={{color:logged?C.green:"#2a2a2a",fontSize:logged?15:18,fontWeight:700}}>
                  {logged?"✓":"›"}
                </span>
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
              return(
                <div key={s.id} ref={el=>rowRefs.current[i]=el}
                  style={{...crd,
                    opacity:isDragging?0.35:1,
                    borderColor:isOver?C.green:C.border,
                    transform:isOver?"translateY(-2px)":"translateY(0)",
                    transition:"opacity 0.15s,border-color 0.1s,transform 0.1s",
                  }}>
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
                        {vol>0?` · Vol ${vol}kg`:""}
                      </div>
                      {s.note&&<div style={{fontSize:11,color:"#3a5818",marginTop:3,fontStyle:"italic"}}>"{s.note}"</div>}
                    </div>
                  </div>
                  <button style={dBtn}
                    onClick={e=>{e.stopPropagation();setModal({type:"confirm",msg:"Delete this exercise?",onOk:()=>delSession(s.mId,s.eId,s.id)});}}
                    onMouseEnter={e=>e.currentTarget.style.color="#cc2222"}
                    onMouseLeave={e=>e.currentTarget.style.color="#252525"}>✕</button>
                </div>
              );
            })}
          </div>
        </div>
        <FloatBtn label="＋  Add Exercise" onClick={()=>setWizard({step:"muscle",date:viewDay})} visible={fabVisible}/>
      </div>
    );
  }

  // ── EXERCISE HISTORY (from sidebar tap) ──────────────────
  function ExerciseHistory(){
    const {mId,eId}=viewEx||{};
    const muscle=getMuscle(mId);
    const exer  =getEx(mId,eId);
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
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={hdr}>
          <button style={bkBtn} onClick={()=>setScreen("home")}>← Back</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={ttl}>{exer.name}</div>
            <div style={sub}>{muscle?.name} · {exer.sessions.length} sessions</div>
          </div>
        </div>
        <div ref={scrollRef} style={{flex:1,overflowY:"auto",paddingBottom:110}}>
          {sessions.length===0&&<div style={mpt}>No sessions yet<br/>Tap Record Session to start</div>}          {sessions.map((s,i)=>{
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
    const [editNote,setEN]=useState(false);
    const [noteVal, setNV]=useState(session?.note||"");
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
        <div ref={scrollRef} style={{flex:1,overflowY:"auto",paddingBottom:110}}>
          <div style={{padding:"10px 14px"}}>
            {!editNote
              ?<div style={nBox} onClick={()=>{setEN(true);setNV(session.note);}}>
                {session.note||<span style={{color:"#1c1c1c"}}>+ Add session note…</span>}
              </div>
              :<input style={{...inp,marginBottom:0}} autoFocus value={noteVal}
                onChange={e=>setNV(e.target.value)}
                onBlur={()=>{updateNote(mId,eId,sid,noteVal);setEN(false);}}
                onKeyDown={e=>{if(e.key==="Enter"){updateNote(mId,eId,sid,noteVal);setEN(false);}}}/>
            }
          </div>
          <div style={sLbl}>Sets</div>
          <SetList sets={session.sets} mId={mId} eId={eId} sid={sid}/>

        </div>
        <FloatBtn label="+ Log Set" onClick={()=>setModal({type:"addSet",mId,eId,sid})} visible={fabVisible} left/>
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────
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
    </div>
  );
}
