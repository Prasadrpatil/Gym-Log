import { useState, useEffect, useRef } from "react";
import { AppCtx } from "./context";
import { uid } from "./id";
import { localISO, parseISO } from "./dates";
import { STORAGE_KEY, initData, purgeEmptySessions, makeDefaultUser, getAllSessions } from "./dataModel";
import { isUnlocked, saveUnlockExp } from "./license";
import useScrollVisible from "./hooks/useScrollVisible";
import LockScreen from "./components/LockScreen";
import AppShell from "./components/AppShell";

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
  const [saveError, setSaveError] = useState(null);
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
  const replaceData = (next) => {
    setData(purgeEmptySessions(next));
    setScreen("home"); setWizard(null); setModal(null); setSidebar(false);
    setViewDay(null); setViewEx(null); setViewSid(null);
  };

  // ── Update active user's muscles ─────────────────────────
  const setMuscles = (fn) => setData(d=>({...d,users:d.users.map(u=>u.id===activeUser.id?{...u,muscles:fn(u.muscles)}:u)}));

  // A swallowed write leaves the user logging into a UI that looks fine while
  // nothing persists, so surface the failure instead.
  useEffect(()=>{
    try{
      localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
      setSaveError(null);
    }catch(e){
      setSaveError(e?.name==="QuotaExceededError"
        ? "Storage full — recent changes are NOT saved. Export a backup from the menu, then delete old sessions."
        : "Could not save to storage. Recent changes may be lost — export a backup from the menu.");
    }
  },[data]);
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
  const restMap  = useRef({});     // sid -> {restSec,restEnd,rung} — memory only, never persisted
  const prevScreen = useRef("home"); // track where ExerciseDetail was opened from

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

  // Capacitor back button — registered once. The listener is added after an
  // await, so re-registering per navigation lets cleanup run while the handle
  // is still null, leaking a listener and popping several screens per press.
  const backRef = useRef(handleBack);
  backRef.current = handleBack;
  useEffect(()=>{
    let h=null, dead=false;
    const fire=()=>backRef.current();
    (async()=>{
      try{
        const {App}=await import('@capacitor/app');
        capApp.current=App;
        const sub=await App.addListener('backButton',fire);
        if(dead) sub.remove(); else h=sub;
      }catch{
        window.history.pushState({g:1},"");
        const fn=()=>{ window.history.pushState({g:1},""); fire(); };
        window.addEventListener("popstate",fn);
        const sub={remove:()=>window.removeEventListener("popstate",fn)};
        if(dead) sub.remove(); else h=sub;
      }
    })();
    return ()=>{ dead=true; h?.remove(); };
  },[]);

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
  const todayStr = localISO();
  const allSess  = getAllSessions(muscles);
  const weekStart= (()=>{ const d=new Date(); d.setDate(d.getDate()-d.getDay()); return localISO(d); })();
  const weekExSessions = allSess.filter(s=>s.date>=weekStart&&s.date<=todayStr);
  const weekSessions = new Set(weekExSessions.map(s=>s.date)).size; // unique training days
  const weekTotalEx = weekExSessions.length; // total exercises across all days
  const streak = (()=>{
    const days=[...new Set(allSess.map(s=>s.date))].sort().reverse();
    if(!days.length) return 0;
    let count=0; let cur=parseISO(todayStr);
    for(const d of days){
      let diff=Math.round((cur-parseISO(d))/(1000*60*60*24));
      // Skip Sundays: if the gap is exactly 2 and the skipped day is a Sunday, treat as 1
      if(diff===2){
        const skipped=new Date(cur); skipped.setDate(skipped.getDate()-1);
        if(skipped.getDay()===0) diff=1; // Sunday in the gap — forgive it
      }
      if(diff>1) break;
      if(diff===0||diff===1){ count++; cur=parseISO(d); }
    }
    return count;
  })();

  const ctx = {
    data,setData,screen,setScreen,viewDay,setViewDay,viewSid,setViewSid,viewEx,setViewEx,
    wizard,setWizard,sidebar,setSidebar,anatomyOpen,setAnatomyOpen,bwOpen,setBwOpen,
    stepsOpen,setStepsOpen,modal,setModal,sbOpen,setSbOpen,calOpen,setCalOpen,
    expandedDay,setExpandedDay,saveError,doUnlock,
    sideRef,sideSwipeRef,scrollRef,wScrollRef,timerMap,restMap,prevScreen,
    fabVisible,wizFabVisible,
    activeUser,muscles,dailyWeights,dailySteps,weekSessions,weekTotalEx,streak,todayStr,
    switchUser,addUser,delUser,renameUser,replaceData,
    getMuscle,getEx,getSess,sortEx,sortSess,
    addMuscle,delMuscle,addEx,delEx,renameEx,addSession,delSession,
    addSet,delSet,updateSet,reorderSets,reorderDaySessions,setDayWeight,setDaySteps,
  };

  if (locked) return <AppCtx.Provider value={ctx}><LockScreen/></AppCtx.Provider>;
  return <AppCtx.Provider value={ctx}><AppShell/></AppCtx.Provider>;
}
