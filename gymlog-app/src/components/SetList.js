import { useState, useEffect, useRef } from "react";
import { useApp } from "../context";
import { C, T, sRow, dBtn, mpt } from "../theme";

// ── Set list with long-press drag-to-reorder ─────────────
function SetList({sets,mId,eId,sid}){
  const {setModal,addSet,delSet,reorderSets} = useApp();
  const [localSets,setLocalSets]=useState(sets);
  const [dragging,setDragging]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  const longPressTimer=useRef(null);
  const rowRefs=useRef([]);
  const dragState=useRef({active:false,idx:null});

  useEffect(()=>setLocalSets(sets),[sets]);

  if(!localSets.length) return <div style={mpt}>Tap + Log Set to add your first set</div>;

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
        const arr=[...localSets];
        const [moved]=arr.splice(from,1);
        arr.splice(to,0,moved);
        setLocalSets(arr);
        reorderSets(mId,eId,sid,arr);
      }
    }
    dragState.current={active:false,idx:null};
    setDragging(null);
    setDragOver(null);
  };

  return(
    <div onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {localSets.map((s,i)=>{
        const type=s.type||"normal";
        const isDragging=dragging===i;
        const isOver=dragOver===i&&dragging!==null&&dragging!==i;
        const typeTag=type!=="normal"
          ?<span style={{fontSize:9,background:type==="drop"?"#2a1500":"#001a2a",color:type==="drop"?"#ff8800":"#00aaff",borderRadius:4,padding:"1px 6px",letterSpacing:1,textTransform:"uppercase",marginLeft:6}}>{type}</span>
          :null;
        return(
          <div key={s.id} ref={el=>rowRefs.current[i]=el}
            style={{...sRow,flexDirection:"column",alignItems:"stretch",
              opacity:isDragging?0.35:1,
              borderColor:isOver?C.green:"#171717",
              transform:isOver?"translateY(-2px)":"translateY(0)",
              transition:"opacity 0.15s,border-color 0.1s,transform 0.1s",
            }}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span
                style={{fontSize:16,color:isDragging?"#c8f72c":"#383838",padding:"6px 8px",flexShrink:0,cursor:"grab",userSelect:"none"}}
                onTouchStart={e=>startLongPress(i,e)}
                onTouchEnd={cancelLongPress}
                onMouseDown={e=>e.stopPropagation()}>⠿</span>
              <span style={{fontSize:10,color:C.dim,letterSpacing:2,width:22,flexShrink:0}}>S{i+1}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"baseline",gap:4,flexWrap:"wrap"}}>
                  {type==="super"
                    ?<span style={{fontSize:12,color:"#ccc",fontWeight:600}}>Super Set · {s.superSets?.length||0} exercises</span>
                    :<>
                      {s.weight!=null&&<><span style={{fontWeight:700,fontSize:17,color:C.green}}>{s.weight}</span><span style={{fontSize:10,color:C.dim}}>kg ×</span></>}
                      <span style={{fontWeight:700,fontSize:17,color:C.green}}>{s.reps}</span>
                      <span style={{fontSize:10,color:C.dim}}>reps</span>
                    </>
                  }
                  {typeTag}
                </div>
                {s.note&&<div style={{fontSize:11,color:"#385016",marginTop:2,fontStyle:"italic"}}>"{s.note}"</div>}
              </div>
              {type!=="super"&&s.weight!=null&&<span style={{fontSize:11,color:"#243810",flexShrink:0}}>{Math.round(s.weight*s.reps)}kg</span>}
              <button
                style={{background:"#0d1400",border:"1px solid #1e3000",color:"#6a9a00",
                  borderRadius:6,padding:"4px 9px",fontSize:11,fontWeight:700,cursor:"pointer",
                  flexShrink:0,lineHeight:1,...T,letterSpacing:0.5}}
                onMouseDown={e=>e.stopPropagation()}
                title="Duplicate set"
                onClick={()=>addSet(mId,eId,sid,{weight:s.weight,reps:s.reps,type:s.type||"normal",note:s.note||"",dropSets:s.dropSets||[],superSets:s.superSets||[]})}
                onMouseEnter={e=>{e.currentTarget.style.background="#141e00";e.currentTarget.style.color=C.green;}}
                onMouseLeave={e=>{e.currentTarget.style.background="#0d1400";e.currentTarget.style.color="#6a9a00";}}>⎘</button>
              <button style={{...dBtn,fontSize:14,color:"#2a2a2a",padding:"4px 8px"}}
                onMouseDown={e=>e.stopPropagation()}
                onClick={()=>setModal({type:"editSet",mId,eId,sid,set:s})}
                onMouseEnter={e=>e.currentTarget.style.color="#c8f72c"}
                onMouseLeave={e=>e.currentTarget.style.color="#2a2a2a"}>✎</button>
              <button style={{...dBtn,fontSize:16,padding:"4px 6px"}}
                onMouseDown={e=>e.stopPropagation()}
                onClick={()=>setModal({type:"confirm",msg:`Delete set ${i+1}?`,onOk:()=>delSet(mId,eId,sid,s.id)})}
                onMouseEnter={e=>e.currentTarget.style.color="#cc2222"}
                onMouseLeave={e=>e.currentTarget.style.color="#252525"}>✕</button>
            </div>
            {type==="drop"&&s.dropSets?.length>0&&(
              <div style={{marginTop:8,paddingLeft:34}}>
                {s.dropSets.map((d,di)=>(
                  <div key={d.id||di} style={{display:"flex",alignItems:"baseline",gap:4,marginTop:4}}>
                    <span style={{fontSize:9,color:"#333",width:18,flexShrink:0}}>D{di+1}</span>
                    {d.weight!=null&&<><span style={{fontSize:14,fontWeight:600,color:"#ff8800"}}>{d.weight}</span><span style={{fontSize:10,color:C.dim}}>kg ×</span></>}
                    <span style={{fontSize:14,fontWeight:600,color:"#ff8800"}}>{d.reps}</span>
                    <span style={{fontSize:10,color:C.dim}}>reps</span>
                  </div>
                ))}
              </div>
            )}
            {type==="super"&&s.superSets?.length>0&&(
              <div style={{marginTop:8,paddingLeft:34}}>
                {s.superSets.map((ss,si)=>(
                  <div key={si} style={{display:"flex",alignItems:"baseline",gap:4,marginTop:4,flexWrap:"wrap"}}>
                    <span style={{fontSize:10,color:"#555",marginRight:4}}>{ss.name}</span>
                    {ss.weight!=null&&<><span style={{fontSize:14,fontWeight:600,color:"#00aaff"}}>{ss.weight}</span><span style={{fontSize:10,color:C.dim}}>kg ×</span></>}
                    <span style={{fontSize:14,fontWeight:600,color:"#00aaff"}}>{ss.reps}</span>
                    <span style={{fontSize:10,color:C.dim}}>reps</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SetList;
