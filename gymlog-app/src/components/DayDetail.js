import { useState, useEffect, useRef } from "react";
import { useApp } from "../context";
import { hdr, bkBtn, ttl, sub, crd, C, dBtn, mpt } from "../theme";
import { getAllSessions } from "../dataModel";
import { fmtDate } from "../dates";
import MuscleIcon from "./MuscleIcon";
import FloatBtn from "./FloatBtn";

function DayDetail(){
  const {data,setScreen,viewDay,setViewSid,setWizard,setModal,expandedDay,setExpandedDay,scrollRef,prevScreen,muscles,dailyWeights,dailySteps,delSession,reorderDaySessions} = useApp();
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

export default DayDetail;
