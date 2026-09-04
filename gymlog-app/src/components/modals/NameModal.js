import { useState } from "react";
import { useApp } from "../../context";
import { inp, rw, btn, mTtl } from "../../theme";
import Wrap from "../Wrap";

function NameModal({title,ph,onAdd,checkDupe}){
  const {setModal} = useApp();
  const [v,sv]=useState("");
  const dupe = checkDupe&&v.trim()&&checkDupe(v.trim());
  const doAdd=()=>{ if(v.trim()&&!dupe){ onAdd(v.trim()); setModal(null); } };
  return <Wrap>
    <div style={mTtl}>{title}</div>
    <input style={{...inp,borderColor:dupe?"#883300":"#1e1e1e"}} placeholder={ph} value={v} autoFocus
      onChange={e=>sv(e.target.value)}
      onKeyDown={e=>{if(e.key==="Enter") doAdd();}}/>
    {dupe&&<div style={{fontSize:11,color:"#883300",marginBottom:10,marginTop:-6}}>Already exists — won't be added again</div>}
    <div style={rw}>
      <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
      <button style={btn(true,!!dupe)} onMouseDown={e=>{e.stopPropagation();doAdd();}}>Add</button>
    </div>
  </Wrap>;
}

export default NameModal;
