import { useState } from "react";
import { useApp } from "../../context";
import { inp } from "../../theme";

// Shared exercise search widget for super set add
function SuperExSearch({superRows,setSuperRows}){
  const {muscles} = useApp();
  const [q,setQ]=useState("");
  const allEx=muscles.flatMap(m=>m.exercises.map(e=>({...e,mId:m.id,mName:m.name})));
  const filtered=allEx.filter(e=>
    e.name.toLowerCase().includes(q.toLowerCase())&&
    !superRows.find(s=>s.eId===e.id&&s.mId===e.mId)
  );
  return(
    <div style={{marginBottom:6}}>
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#3a3a3a",pointerEvents:"none"}}>⌕</span>
        <input style={{...inp,paddingLeft:36,marginBottom:4}} placeholder="Add exercise to super set…"
          value={q} onChange={e=>setQ(e.target.value)}/>
      </div>
      {q&&<div style={{maxHeight:150,overflowY:"auto",border:"1px solid #1e1e1e",borderRadius:8,marginBottom:8}}>
        {filtered.slice(0,8).map(e=>(
          <div key={`${e.mId}/${e.id}`} style={{padding:"10px 14px",borderBottom:"1px solid #111",cursor:"pointer",fontSize:13,color:"#888"}}
            onMouseDown={ev=>{ev.stopPropagation();setSuperRows(s=>[...s,{eId:e.id,mId:e.mId,name:e.name,mName:e.mName,w:"",r:""}]);setQ("");}}>
            {e.name}<span style={{fontSize:10,color:"#333"}}> · {e.mName}</span>
          </div>
        ))}
        {filtered.length===0&&<div style={{padding:"10px 14px",fontSize:12,color:"#333"}}>No matches</div>}
      </div>}
    </div>
  );
}

export default SuperExSearch;
