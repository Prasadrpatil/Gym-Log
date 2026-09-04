import { useRef } from "react";
import { useApp } from "../context";
import { hdr, bkBtn, ttl, sub, mpt, sLbl } from "../theme";
import { fmtDate } from "../dates";
import useScrollVisible from "../hooks/useScrollVisible";
import StatsBar from "./StatsBar";
import TimerBar from "./TimerBar";
import SetList from "./SetList";
import FloatBtn from "./FloatBtn";

function SetsLogger({mId,eId,sid,date,muscle,exer,session,onBack,onDone}){
  const {setModal,sortSess,addSet} = useApp();
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
      <TimerBar key={sid} sid={sid}/>
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

export default SetsLogger;
