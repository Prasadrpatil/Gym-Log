import { useState, useRef } from "react";
import { useApp } from "../context";
import { hdr, bkBtn, ttl, sub, crd, C, dBtn, mpt } from "../theme";
import { localISO, fmtDate } from "../dates";
import FloatBtn from "./FloatBtn";

function ExerciseHistory(){
  const {setScreen,setViewSid,viewEx,setWizard,setModal,scrollRef,prevScreen,fabVisible,getMuscle,getEx,sortSess,delSession} = useApp();
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
      <FloatBtn label="＋  Record Session" onClick={()=>setWizard({step:"muscle",date:localISO()})} visible={fabVisible}/>
    </div>
  );
}

export default ExerciseHistory;
