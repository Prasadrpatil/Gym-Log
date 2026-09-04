import { useState } from "react";
import { useApp } from "../../context";
import { inp, rw, btn, mTtl } from "../../theme";
import Wrap from "../Wrap";

function EditExModal({mId,eId,current}){
  const {setModal,renameEx} = useApp();
  const [v,sv]=useState(current);
  const doSave=()=>{ if(v.trim()&&v.trim()!==current){ renameEx(mId,eId,v.trim()); } setModal(null); };
  return <Wrap>
    <div style={mTtl}>Rename Exercise</div>
    <input style={inp} value={v} autoFocus
      onChange={e=>sv(e.target.value)}
      onKeyDown={e=>{if(e.key==="Enter") doSave();}}/>
    <div style={rw}>
      <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
      <button style={btn(true)} onMouseDown={e=>{e.preventDefault();e.stopPropagation();doSave();}}>Save</button>
    </div>
  </Wrap>;
}

export default EditExModal;
