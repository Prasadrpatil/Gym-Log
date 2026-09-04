import { useApp } from "../context";
import { fmtDate } from "../dates";
import { hdr, bkBtn, ttl, sub, sLbl } from "../theme";
import StatsBar from "./StatsBar";
import TimerBar from "./TimerBar";
import SetList from "./SetList";
import FloatBtn from "./FloatBtn";

function ExerciseDetail(){
  const {setScreen,viewSid,setModal,scrollRef,prevScreen,getMuscle,getEx,getSess} = useApp();
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
      <TimerBar key={sid} sid={sid}/>
      <div ref={scrollRef} style={{flex:1,overflowY:"auto",paddingBottom:110}}>
        <div style={sLbl}>Sets</div>
        <SetList sets={session.sets} mId={mId} eId={eId} sid={sid}/>
      </div>
      <FloatBtn label="+ Log Set" onClick={()=>setModal({type:"addSet",mId,eId,sid})} visible={true} left/>
    </div>
  );
}

export default ExerciseDetail;
