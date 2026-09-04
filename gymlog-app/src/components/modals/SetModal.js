import { useState } from "react";
import { useApp } from "../../context";
import { C, T, mTtl, rw, inp, btn, dBtn } from "../../theme";
import { uid } from "../../id";
import { validReps, toReps, toWeight } from "../../validation";
import Wrap from "../Wrap";

// Weight is now optional
function SetModal({mId,eId,sid}){
  const {setModal,muscles,addSet} = useApp();
  const [type,setType]=useState("normal"); // "normal"|"drop"|"super"
  const [w,sw]=useState("");
  const [r,sr]=useState("");
  const [n,sn]=useState("");
  // Drop set rows
  const [drops,setDrops]=useState([{id:uid(),w:"",r:""}]);
  // Super set: selected exercises + their w/r
  const allEx=muscles.flatMap(m=>m.exercises.map(e=>({...e,mId:m.id,mName:m.name})));
  const [superEx,setSuperEx]=useState([]); // [{eId,mId,mName,name,w,r}]
  const [exSearch,setExSearch]=useState("");

  const canLog = type==="normal"?validReps(r)
    : type==="drop"?validReps(r)&&drops.some(d=>validReps(d.r))
    : superEx.length>0&&superEx.every(e=>validReps(e.r));

  const doLog=()=>{
    if(!canLog) return;
    if(type==="normal"){
      addSet(mId,eId,sid,{weight:toWeight(w),reps:toReps(r),note:n,type:"normal",dropSets:[],superSets:[]});
    } else if(type==="drop"){
      addSet(mId,eId,sid,{weight:toWeight(w),reps:toReps(r),note:n,type:"drop",
        dropSets:drops.filter(d=>validReps(d.r)).map(d=>({id:d.id,weight:toWeight(d.w),reps:toReps(d.r)})),
        superSets:[]});
    } else {
      addSet(mId,eId,sid,{weight:null,reps:0,note:n,type:"super",dropSets:[],
        superSets:superEx.map(e=>({eId:e.eId,mId:e.mId,name:e.name,weight:toWeight(e.w),reps:toReps(e.r)}))});
    }
    setModal(null);
  };

  const tabStyle=(t)=>({
    flex:1,padding:"10px 4px",border:"none",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700,
    letterSpacing:1,textTransform:"uppercase",...T,
    background:type===t?C.green:"#181818",color:type===t?"#000":"#555",
  });

  const filteredEx=allEx.filter(e=>
    e.name.toLowerCase().includes(exSearch.toLowerCase()) &&
    !superEx.find(s=>s.eId===e.id&&s.mId===e.mId)
  );

  return <Wrap>
    <div style={mTtl}>Log Set</div>

    {/* Type tabs */}
    <div style={{display:"flex",gap:6,marginBottom:14}}>
      <button style={tabStyle("normal")} onMouseDown={e=>{e.stopPropagation();setType("normal");}}>Normal</button>
      <button style={tabStyle("drop")}   onMouseDown={e=>{e.stopPropagation();setType("drop");}}>Drop Set</button>
      <button style={tabStyle("super")}  onMouseDown={e=>{e.stopPropagation();setType("super");}}>Super Set</button>
    </div>

    {/* NORMAL */}
    {type==="normal"&&<>
      <div style={rw}>
        <input style={{...inp,flex:1}} type="number" min="0" step="any" placeholder="Weight kg (opt)" value={w} autoFocus onChange={e=>sw(e.target.value)}/>
        <input style={{...inp,flex:1}} type="number" min="0" step="1" placeholder="Reps *" value={r} onChange={e=>sr(e.target.value)}/>
      </div>
      <input style={inp} placeholder="Note (optional)" value={n} onChange={e=>sn(e.target.value)}/>
    </>}

    {/* DROP SET */}
    {type==="drop"&&<>
      <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Main Set</div>
      <div style={rw}>
        <input style={{...inp,flex:1}} type="number" min="0" step="any" placeholder="Weight kg (opt)" value={w} autoFocus onChange={e=>sw(e.target.value)}/>
        <input style={{...inp,flex:1}} type="number" min="0" step="1" placeholder="Reps *" value={r} onChange={e=>sr(e.target.value)}/>
      </div>
      <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Drop Sets</div>
      {drops.map((d,i)=>(
        <div key={d.id} style={{...rw,alignItems:"center",marginBottom:2}}>
          <span style={{fontSize:10,color:C.dim,width:20,flexShrink:0}}>D{i+1}</span>
          <input style={{...inp,flex:1,marginBottom:0}} type="number" min="0" step="any" placeholder="Weight (opt)" value={d.w}
            onChange={e=>setDrops(ds=>ds.map((x,j)=>j===i?{...x,w:e.target.value}:x))}/>
          <input style={{...inp,flex:1,marginBottom:0,marginLeft:6}} type="number" min="0" step="1" placeholder="Reps *" value={d.r}
            onChange={e=>setDrops(ds=>ds.map((x,j)=>j===i?{...x,r:e.target.value}:x))}/>
          {drops.length>1&&<button style={{...dBtn,color:"#444"}}
            onMouseDown={e=>{e.stopPropagation();setDrops(ds=>ds.filter((_,j)=>j!==i));}}>✕</button>}
        </div>
      ))}
      <button style={{...btn(false),marginTop:6,marginBottom:10,fontSize:11}}
        onMouseDown={e=>{e.stopPropagation();setDrops(ds=>([...ds,{id:uid(),w:"",r:""}]));}}>+ Add Drop</button>
      <input style={inp} placeholder="Note (optional)" value={n} onChange={e=>sn(e.target.value)}/>
    </>}

    {/* SUPER SET */}
    {type==="super"&&<>
      <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Selected Exercises</div>
      {superEx.length===0&&<div style={{fontSize:12,color:"#333",marginBottom:10,textAlign:"center",padding:"10px"}}>Search and add exercises below</div>}
      {superEx.map((e,i)=>(
        <div key={`${e.mId}/${e.eId}`} style={{background:"#0d0d0d",border:"1px solid #1e1e1e",borderRadius:8,padding:"10px 12px",marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:6}}>
            <span style={{flex:1,fontSize:12,color:"#ccc",fontWeight:600}}>{e.name}</span>
            <button style={{...dBtn,fontSize:14,color:"#333",padding:"2px 6px"}}
              onMouseDown={ev=>{ev.stopPropagation();setSuperEx(s=>s.filter((_,j)=>j!==i));}}>✕</button>
          </div>
          <div style={rw}>
            <input style={{...inp,flex:1,marginBottom:0,padding:"9px"}} type="number" min="0" step="any" placeholder="Weight (opt)" value={e.w||""}
              onChange={ev=>setSuperEx(s=>s.map((x,j)=>j===i?{...x,w:ev.target.value}:x))}/>
            <input style={{...inp,flex:1,marginBottom:0,padding:"9px",marginLeft:6}} type="number" min="0" step="1" placeholder="Reps *" value={e.r||""}
              onChange={ev=>setSuperEx(s=>s.map((x,j)=>j===i?{...x,r:ev.target.value}:x))}/>
          </div>
        </div>
      ))}
      <div style={{position:"relative",marginBottom:4}}>
        <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#3a3a3a",pointerEvents:"none"}}>⌕</span>
        <input style={{...inp,marginBottom:4,paddingLeft:36}} placeholder="Search exercises to add…"
          value={exSearch} onChange={e=>setExSearch(e.target.value)}/>
      </div>
      {exSearch&&<div style={{maxHeight:160,overflowY:"auto",border:"1px solid #1e1e1e",borderRadius:8,marginBottom:10}}>
        {filteredEx.slice(0,8).map(e=>(
          <div key={`${e.mId}/${e.id}`} style={{padding:"10px 14px",borderBottom:"1px solid #111",cursor:"pointer",fontSize:13,color:"#888"}}
            onMouseDown={ev=>{ev.stopPropagation();setSuperEx(s=>[...s,{eId:e.id,mId:e.mId,name:e.name,mName:e.mName,w:"",r:""}]);setExSearch("");}}>
            {e.name} <span style={{fontSize:10,color:"#333"}}>· {e.mName}</span>
          </div>
        ))}
        {filteredEx.length===0&&<div style={{padding:"10px 14px",fontSize:12,color:"#333"}}>No matches</div>}
      </div>}
      <input style={inp} placeholder="Note (optional)" value={n} onChange={e=>sn(e.target.value)}/>
    </>}

    <div style={rw}>
      <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
      <button style={btn(true,!canLog)} onMouseDown={e=>{e.stopPropagation();doLog();}}>Log Set</button>
    </div>
  </Wrap>;
}

export default SetModal;
