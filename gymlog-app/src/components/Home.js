import { useApp } from "../context";
import { hdr, mnBtn, ttl, sub, mpt, C, dBtn } from "../theme";
import { getAllSessions, groupByDay } from "../dataModel";
import { localISO, fmtDate } from "../dates";
import MuscleIcon from "./MuscleIcon";
import FloatBtn from "./FloatBtn";

function Home(){
  const {setScreen,setViewDay,setWizard,setSidebar,setAnatomyOpen,setBwOpen,setStepsOpen,setModal,setCalOpen,scrollRef,activeUser,muscles,dailyWeights,dailySteps,weekSessions,weekTotalEx,streak,delSession,saveError} = useApp();
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

  const statsItems=[
    {label:"Sessions",value:weekSessions||0,sub:"this week"},
    {label:"Streak",value:streak?`${streak}d`:"0d",sub:streak>=3?"🔥 on fire!":streak>0?"keep going":"start today"},
    {label:"Exercises",value:weekTotalEx||0,sub:"this week"},
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

        {saveError&&(
          <div style={{margin:"10px 14px 0",padding:"12px 14px",background:"#1a0000",
            border:"1px solid #5a0000",borderRadius:10,fontSize:11,color:"#e85d2a",lineHeight:1.6}}
            onClick={()=>setModal({type:"backup"})}>
            <div style={{fontWeight:700,letterSpacing:1,marginBottom:3}}>⚠ NOT SAVED</div>
            {saveError}
          </div>
        )}

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

      <FloatBtn label="＋  Record Session" onClick={()=>setWizard({step:"muscle",date:localISO()})} visible={true}/>
    </div>
  );
}

export default Home;
