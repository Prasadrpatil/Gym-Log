import { useState, useEffect } from "react";
import { useApp } from "../context";
import { bkBtn, C } from "../theme";
import { primeAudio, playRing } from "../audio";

// ── TIMER BAR — stopwatch + countdown rest timer ────────────
// Mounted with key={sid}, so the maps are read once per session and the
// component owns the reactive copy from then on. The refs live on App purely
// so a timer survives navigating away and back.
function TimerBar({sid}){
  const {timerMap,restMap} = useApp();
  const [sw,setSw]   = useState(()=>timerMap.current[sid]||{running:false,elapsed:0,start:null});
  const [rest,setRest] = useState(()=>restMap.current[sid]||null);
  const [now,setNow] = useState(()=>Date.now());

  useEffect(()=>{ timerMap.current[sid]=sw; },[timerMap,sid,sw]);
  useEffect(()=>{ if(rest) restMap.current[sid]=rest; else delete restMap.current[sid]; },[restMap,sid,rest]);

  // Derived from state, so this is a real reactive dependency — reading
  // ref.current in a dep array only worked by accident before.
  const ticking = sw.running || (!!rest && !rest.rung);
  useEffect(()=>{
    if(!ticking) return;
    const iv=setInterval(()=>setNow(Date.now()),1000);
    return ()=>clearInterval(iv);
  },[ticking]);

  // Ring once when the countdown reaches zero
  useEffect(()=>{
    if(!rest||rest.rung||now<rest.restEnd) return;
    playRing();
    setRest(r=>r?{...r,rung:true}:r);
  },[now,rest]);

  // Auto-stop the stopwatch at 30 min
  useEffect(()=>{
    if(!sw.running) return;
    if(sw.elapsed+Math.floor((now-sw.start)/1000)>=30*60) setSw({running:false,elapsed:0,start:null});
  },[now,sw]);

  const elapsed=sw.running ? sw.elapsed+Math.floor((now-sw.start)/1000) : sw.elapsed;
  const mm=String(Math.floor(elapsed/60)).padStart(2,"0");
  const ss=String(elapsed%60).padStart(2,"0");
  const swActive=sw.running||sw.elapsed>0;

  const swStart=()=>{ primeAudio(); setNow(Date.now()); setSw(s=>({running:true,elapsed:s.elapsed,start:Date.now()})); };
  const swStop=()=>{ setSw(s=>({running:false,elapsed:s.elapsed+Math.floor((Date.now()-s.start)/1000),start:null})); };
  const swReset=()=>{ setSw({running:false,elapsed:0,start:null}); };

  // Rest timer
  const restEnd=rest?.restEnd||null;
  const restRemaining=restEnd ? Math.max(0,Math.ceil((restEnd-now)/1000)) : null;
  const restDone=!!restEnd && restRemaining===0;
  const restActive=!!restEnd && restRemaining>0;
  const restMm=restRemaining!=null?String(Math.floor(restRemaining/60)).padStart(2,"0"):"00";
  const restSs=restRemaining!=null?String(restRemaining%60).padStart(2,"0"):"00";

  const startRest=(sec)=>{
    primeAudio(); // unlock audio from this tap, or the chime never sounds
    setNow(Date.now());
    setRest({restSec:sec, restEnd:Date.now()+sec*1000, rung:false});
  };
  const cancelRest=()=>setRest(null);

  return(
    <div style={{background:"#0a0a0a",borderBottom:"1px solid #141414",flexShrink:0}}>
      {/* Row 1: stopwatch + rest timer display */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px"}}>
        {/* Stopwatch */}
        <div style={{background:swActive?"#0d1400":"#0d0d0d",border:`1px solid ${swActive?"#1e3000":"#1a1a1a"}`,
          borderRadius:8,padding:"5px 10px",minWidth:64,textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:16,fontWeight:700,color:swActive?C.green:"#2a2a2a",letterSpacing:2,fontVariantNumeric:"tabular-nums"}}>{mm}:{ss}</div>
          <div style={{fontSize:7,color:"#2a3a10",letterSpacing:2,textTransform:"uppercase",marginTop:1}}>stopwatch</div>
        </div>
        <button style={{...bkBtn,padding:"9px 13px",fontSize:14,
          color:sw.running?"#ff8800":"#6a9a00",borderColor:sw.running?"#3a1a00":"#1e3000"}}
          onClick={sw.running?swStop:swStart}>{sw.running?"⏸":"▶"}</button>
        {!sw.running&&sw.elapsed>0&&(
          <button style={{...bkBtn,padding:"9px 13px",fontSize:13,color:"#555",borderColor:"#1a1a1a"}}
            onClick={swReset}>↺</button>
        )}

        {/* Rest countdown (shown when active) */}
        {(restActive||restDone)&&(
          <div style={{flex:1,display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
            <div style={{background:restDone?"#1a0d00":restActive?"#001a0d":"#0d0d0d",
              border:`1px solid ${restDone?"#cc4400":restActive?"#006633":"#1a1a1a"}`,
              borderRadius:8,padding:"5px 10px",minWidth:64,textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:700,letterSpacing:2,fontVariantNumeric:"tabular-nums",
                color:restDone?C.red:C.green}}>{restMm}:{restSs}</div>
              <div style={{fontSize:7,letterSpacing:2,textTransform:"uppercase",marginTop:1,
                color:restDone?"#883300":"#2a3a10"}}>{restDone?"rest done!":"rest"}</div>
            </div>
            <button style={{...bkBtn,padding:"9px 13px",fontSize:13,color:"#555",borderColor:"#1a1a1a"}}
              onClick={cancelRest}>✕</button>
          </div>
        )}
        {!restActive&&!restDone&&(
          <div style={{flex:1,fontSize:9,color:"#252525",letterSpacing:1,textAlign:"right",textTransform:"uppercase"}}>
            set rest timer →
          </div>
        )}
      </div>
      {/* Row 2: rest presets */}
      <div style={{display:"flex",gap:6,padding:"0 14px 8px"}}>
        <div style={{fontSize:9,color:"#2a2a2a",letterSpacing:1,textTransform:"uppercase",
          alignSelf:"center",marginRight:4,flexShrink:0}}>Rest:</div>
        {[[60,"1m"],[90,"1:30"],[120,"2m"],[180,"3m"],[300,"5m"]].map(([sec,label])=>(
          <button key={sec} onClick={()=>startRest(sec)}
            style={{...bkBtn,padding:"6px 10px",fontSize:10,
              color: rest?.restSec===sec&&restActive?"#000":"#5a8a00",
              background: rest?.restSec===sec&&restActive?C.green:"transparent",
              borderColor: rest?.restSec===sec&&restActive?"#c8f72c":"#1e3000"}}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TimerBar;
