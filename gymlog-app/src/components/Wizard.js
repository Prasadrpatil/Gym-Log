import { useState } from "react";
import { useApp } from "../context";
import { hdr, bkBtn, ttl, sub, crd, C, inp, mpt } from "../theme";
import MuscleIcon from "./MuscleIcon";
import FloatBtn from "./FloatBtn";
import SetsLogger from "./SetsLogger";

function Wizard(){
  const {setScreen,setViewDay,wizard,setWizard,setModal,wScrollRef,wizFabVisible,muscles,dailyWeights,dailySteps,getMuscle,getEx,getSess,sortEx,sortSess,addSession,delSession} = useApp();
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
                      <div key={`${e.mId}/${e.id}`} style={crd}
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

export default Wizard;
