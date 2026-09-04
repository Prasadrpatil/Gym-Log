import { useState } from "react";
import { useApp } from "../../context";
import { T, mTtl, inp, rw, btn } from "../../theme";
import { fmtDate } from "../../dates";
import Wrap from "../Wrap";

function DayStepsModal({date}){
  const {setModal,dailySteps,setDaySteps} = useApp();
  const existing = dailySteps[date];
  const [val,setVal] = useState(existing!=null?String(existing):"");
  const doSave = () => {
    const s = parseInt(val);
    if(!isNaN(s)&&s>=0){ setDaySteps(date,s); }
    setModal(null);
  };
  const doClear = () => { setDaySteps(date,null); setModal(null); };
  return <Wrap>
    <div style={mTtl}>{existing!=null?"Edit Steps":"Log Steps"}</div>
    <div style={{fontSize:11,color:"#444",letterSpacing:1,marginBottom:12}}>{fmtDate(date)}</div>
    <div style={{position:"relative",marginBottom:14}}>
      <input type="number" autoFocus
        style={{...inp,marginBottom:0,paddingRight:56,fontSize:22,textAlign:"center",color:"#5bc8f5",fontWeight:700}}
        placeholder="0" value={val}
        onChange={e=>setVal(e.target.value)}
        onKeyDown={e=>{ if(e.key==="Enter") doSave(); }}/>
      <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#555",...T}}>steps</span>
    </div>
    <div style={rw}>
      {existing!=null&&<button style={{...btn(false,true),flex:"0 0 auto",padding:"14px 18px",fontSize:11}} onMouseDown={e=>{e.stopPropagation();doClear();}}>Clear</button>}
      <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
      <button style={{...btn(true,!val),background:val?"#003a4a":"",color:val?"#5bc8f5":""}} onMouseDown={e=>{e.stopPropagation();doSave();}}>Save</button>
    </div>
  </Wrap>;
}

export default DayStepsModal;
