import { useState, useRef } from "react";
import { useApp } from "../context";
import { C, T, bkBtn } from "../theme";
import { getAllSessions } from "../dataModel";

function CalendarOverlay(){
  const {setScreen,setViewDay,setCalOpen,muscles,dailyWeights,dailySteps,todayStr} = useApp();
  const today = new Date();
  const [yr,  setYr]  = useState(today.getFullYear());
  const [mon, setMon] = useState(today.getMonth()); // 0-indexed

  // Build set of all dates that have sessions
  const sessionDates = new Set(getAllSessions(muscles).map(s=>s.date));

  const monthName = new Date(yr,mon,1).toLocaleString("en-US",{month:"long",year:"numeric"});
  const firstDay  = new Date(yr,mon,1).getDay(); // 0=Sun
  const daysInMonth = new Date(yr,mon+1,0).getDate();

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

export default CalendarOverlay;
