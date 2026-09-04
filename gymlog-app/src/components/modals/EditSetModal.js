import { useState } from "react";
import { useApp } from "../../context";
import { C, mTtl, rw, inp, btn, dBtn } from "../../theme";
import { uid } from "../../id";
import { validReps, toReps, toWeight } from "../../validation";
import Wrap from "../Wrap";
import SuperExSearch from "./SuperExSearch";

// Edit existing set
function EditSetModal({mId,eId,sid,set}){
  const {setModal,updateSet} = useApp();
  const [w,sw]=useState(set.weight!=null?String(set.weight):"");
  const [r,sr]=useState(set.reps?String(set.reps):"");
  const [n,sn]=useState(set.note||"");
  const [drops,setDrops]=useState(
    set.dropSets?.length?set.dropSets.map(d=>({...d,w:d.weight!=null?String(d.weight):"",r:String(d.reps)}))
    :[{id:uid(),w:"",r:""}]
  );
  const type=set.type||"normal";
  const [superRows,setSuperRows]=useState(
    set.superSets?.length?set.superSets.map(ss=>({...ss,w:ss.weight!=null?String(ss.weight):"",r:ss.reps?String(ss.reps):""})):[]
  );
  const canSave=type==="normal"?validReps(r) : type==="drop"?validReps(r) : superRows.every(e=>validReps(e.r));
  const doSave=()=>{
    if(!canSave) return;
    const patch={note:n};
    if(type==="normal"||type==="drop"){
      patch.weight=toWeight(w);
      patch.reps=toReps(r);
    }
    if(type==="drop") patch.dropSets=drops.filter(d=>validReps(d.r)).map(d=>({id:d.id,weight:toWeight(d.w),reps:toReps(d.r)}));
    if(type==="super") patch.superSets=superRows.map(e=>({eId:e.eId,mId:e.mId,name:e.name,weight:toWeight(e.w),reps:toReps(e.r)}));
    updateSet(mId,eId,sid,set.id,patch);
    setModal(null);
  };
  return <Wrap>
    <div style={mTtl}>Edit Set {type!=="normal"&&<span style={{color:C.green,fontSize:10}}>({type})</span>}</div>
    {(type==="normal"||type==="drop")&&<>
      <div style={rw}>
        <input style={{...inp,flex:1}} type="number" min="0" step="any" placeholder="Weight kg (opt)" value={w} autoFocus onChange={e=>sw(e.target.value)}/>
        <input style={{...inp,flex:1}} type="number" min="0" step="1" placeholder="Reps *" value={r} onChange={e=>sr(e.target.value)}/>
      </div>
    </>}
    {type==="drop"&&<>
      <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Drop Sets</div>
      {drops.map((d,i)=>(
        <div key={d.id} style={{...rw,alignItems:"center",marginBottom:2}}>
          <span style={{fontSize:10,color:C.dim,width:20,flexShrink:0}}>D{i+1}</span>
          <input style={{...inp,flex:1,marginBottom:0}} type="number" min="0" step="any" placeholder="Weight (opt)" value={d.w}
            onChange={e=>setDrops(ds=>ds.map((x,j)=>j===i?{...x,w:e.target.value}:x))}/>
          <input style={{...inp,flex:1,marginBottom:0,marginLeft:6}} type="number" min="0" step="1" placeholder="Reps *" value={d.r}
            onChange={e=>setDrops(ds=>ds.map((x,j)=>j===i?{...x,r:e.target.value}:x))}/>
          {drops.length>1&&<button style={{...dBtn,color:"#444"}} onMouseDown={e=>{e.stopPropagation();setDrops(ds=>ds.filter((_,j)=>j!==i));}}>✕</button>}
        </div>
      ))}
      <button style={{...btn(false),marginTop:6,marginBottom:10,fontSize:11}}
        onMouseDown={e=>{e.stopPropagation();setDrops(ds=>([...ds,{id:uid(),w:"",r:""}]));}}>+ Add Drop</button>
    </>}
    {type==="super"&&<>
      <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Super Set Exercises</div>
      {superRows.map((e,i)=>(
        <div key={e.eId?`${e.mId}/${e.eId}`:i} style={{background:"#0d0d0d",border:"1px solid #1e1e1e",borderRadius:8,padding:"10px 12px",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:8}}>
            <span style={{flex:1,fontSize:12,color:"#aaa",fontWeight:600}}>{e.name}</span>
            <button style={{...dBtn,fontSize:14,color:"#333",padding:"2px 6px"}}
              onMouseDown={ev=>{ev.stopPropagation();setSuperRows(s=>s.filter((_,j)=>j!==i));}}>✕</button>
          </div>
          <div style={rw}>
            <input style={{...inp,flex:1,marginBottom:0,padding:"9px"}} type="number" min="0" step="any" placeholder="Weight (opt)" value={e.w}
              onChange={ev=>setSuperRows(s=>s.map((x,j)=>j===i?{...x,w:ev.target.value}:x))}/>
            <input style={{...inp,flex:1,marginBottom:0,padding:"9px",marginLeft:6}} type="number" min="0" step="1" placeholder="Reps *" value={e.r}
              onChange={ev=>setSuperRows(s=>s.map((x,j)=>j===i?{...x,r:ev.target.value}:x))}/>
          </div>
        </div>
      ))}
      {/* Add exercise to super set */}
      <SuperExSearch superRows={superRows} setSuperRows={setSuperRows}/>
    </>}
    <input style={{...inp,marginTop:type==="super"?8:0}} placeholder="Note (optional)" value={n} onChange={e=>sn(e.target.value)}/>
    <div style={rw}>
      <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
      <button style={btn(true,!canSave)} onMouseDown={e=>{e.stopPropagation();doSave();}}>Save</button>
    </div>
  </Wrap>;
}

export default EditSetModal;
