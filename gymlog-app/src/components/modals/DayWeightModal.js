import { useState } from "react";
import { useApp } from "../../context";
import { C, T, mTtl, inp, rw, btn } from "../../theme";
import { fmtDate } from "../../dates";
import Wrap from "../Wrap";

function DayWeightModal({date}){
  const {setModal,dailyWeights,setDayWeight} = useApp();
  const existing = dailyWeights[date];
  const [val,setVal] = useState(existing!=null?String(existing):"");
  const doSave = () => {
    const kg = parseFloat(val);
    if(!isNaN(kg)&&kg>0){ setDayWeight(date,kg); }
    setModal(null);
  };
  const doClear = () => { setDayWeight(date,null); setModal(null); };
  return <Wrap>
    <div style={mTtl}>{existing!=null?"Edit Body Weight":"Log Body Weight"}</div>
    <div style={{fontSize:11,color:"#444",letterSpacing:1,marginBottom:12}}>{fmtDate(date)}</div>
    <div style={{position:"relative",marginBottom:14}}>
      <input type="number" autoFocus
        style={{...inp,marginBottom:0,paddingRight:44,fontSize:22,textAlign:"center",color:C.green,fontWeight:700}}
        placeholder="0.0" value={val}
        onChange={e=>setVal(e.target.value)}
        onKeyDown={e=>{ if(e.key==="Enter") doSave(); }}/>
      <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#555",...T}}>kg</span>
    </div>
    <div style={rw}>
      {existing!=null&&<button style={{...btn(false,true),flex:"0 0 auto",padding:"14px 18px",fontSize:11}} onMouseDown={e=>{e.stopPropagation();doClear();}}>Clear</button>}
      <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
      <button style={btn(true,!val)} onMouseDown={e=>{e.stopPropagation();doSave();}}>Save</button>
    </div>
  </Wrap>;
}

export default DayWeightModal;
