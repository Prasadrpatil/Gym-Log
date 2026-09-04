import { useState } from "react";
import { useApp } from "../context";
import { C, inp, dBtn, btn, T, mpt } from "../theme";
import MuscleIcon from "./MuscleIcon";
import SectionHeader from "./SectionHeader";

function Sidebar(){
  const {data,setScreen,setViewEx,setSidebar,setModal,sbOpen,setSbOpen,sideRef,sideSwipeRef,activeUser,muscles,switchUser,delUser,renameUser,sortEx,sortSess,delMuscle,delEx} = useApp();
  const [sbSearch,setSbSearch]=useState("");
  const [renamingUid,setRenamingUid]=useState(null);
  const [renameVal,setRenameVal]=useState("");
  const [usersOpen,setUsersOpen]=useState(false);
  const [exercisesOpen,setExercisesOpen]=useState(true);
  const trimmed=sbSearch.trim().toLowerCase();

  const allExFiltered = trimmed
    ? muscles.flatMap(m=>
        m.exercises.filter(e=>e.name.toLowerCase().includes(trimmed))
          .map(e=>({...e,mId:m.id,mName:m.name}))
      )
    : null;

  const hiText=(name)=>{
    if(!trimmed) return name;
    const idx=name.toLowerCase().indexOf(trimmed);
    if(idx<0) return name;
    return <>{name.slice(0,idx)}<span style={{color:C.green,fontWeight:700}}>{name.slice(idx,idx+sbSearch.length)}</span>{name.slice(idx+sbSearch.length)}</>;
  };

  return <>
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:50}}/>
    <div ref={sideRef} style={{position:"fixed",top:0,left:0,bottom:0,width:"82%",maxWidth:340,
      background:"#0f0f0f",borderRight:"1px solid #1e1e1e",zIndex:51,overflowY:"hidden",display:"flex",flexDirection:"column",...T}}
      onTouchStart={e=>{const t=e.touches[0];sideSwipeRef.current={x:t.clientX,y:t.clientY};}}
      onTouchEnd={e=>{const s=sideSwipeRef.current;if(!s)return;const dx=s.x-e.changedTouches[0].clientX;const dy=Math.abs(s.y-e.changedTouches[0].clientY);if(dx>50&&dy<60){setSidebar(false);}sideSwipeRef.current=null;}}>

      <div style={{padding:"44px 18px 14px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:22,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:C.text}}>Menu</div>
        <button style={{background:"none",border:"none",color:"#555",fontSize:26,cursor:"pointer",padding:"2px 10px",lineHeight:1}}
          onClick={()=>setSidebar(false)}>✕</button>
      </div>

      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>

        {/* ── USERS SECTION ── */}
        <div style={{borderBottom:"1px solid #1a1a1a"}}>
          <SectionHeader label="Users" open={usersOpen} onToggle={()=>setUsersOpen(o=>!o)}/>
          {usersOpen&&<>
            {data.users.map(u=>{
              const isActive=u.id===data.activeUserId;
              const allUserSess=u.muscles.flatMap(m=>m.exercises.flatMap(e=>e.sessions.filter(s=>s.sets&&s.sets.length>0)));
              const totalSessions=new Set(allUserSess.map(s=>s.date)).size; // unique training days = sessions
              return(
                <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 18px",
                  background:isActive?"#141a00":"transparent",
                  borderLeft:isActive?`3px solid ${C.green}`:"3px solid transparent",
                  cursor:"pointer"}}
                  onMouseDown={e=>e.stopPropagation()}
                  onClick={()=>{if(!isActive){switchUser(u.id);setSidebar(false);}}}>
                  <div style={{width:36,height:36,borderRadius:"50%",
                    background:isActive?C.green:"#1e1e1e",
                    border:`2px solid ${isActive?C.green:"#2a2a2a"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:14,fontWeight:700,color:isActive?"#000":"#555",flexShrink:0}}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    {renamingUid===u.id
                      ? <input
                          style={{...inp,marginBottom:0,padding:"4px 8px",fontSize:13,width:"100%"}}
                          autoFocus value={renameVal}
                          onChange={e=>setRenameVal(e.target.value)}
                          onBlur={()=>{if(renameVal.trim())renameUser(u.id,renameVal.trim());setRenamingUid(null);}}
                          onKeyDown={e=>{if(e.key==="Enter"){if(renameVal.trim())renameUser(u.id,renameVal.trim());setRenamingUid(null);}if(e.key==="Escape")setRenamingUid(null);}}
                          onClick={e=>e.stopPropagation()}
                        />
                      : <>
                          <div style={{fontSize:14,fontWeight:isActive?700:500,color:isActive?C.green:"#888",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.name}</div>
                          <div style={{fontSize:10,color:"#333",marginTop:1}}>{totalSessions} session{totalSessions!==1?"s":""}</div>
                        </>
                    }
                  </div>
                  <button style={{...dBtn,fontSize:13,color:"#2a2a2a",padding:"4px 6px"}}
                    onMouseDown={ev=>{ev.preventDefault();ev.stopPropagation();setRenamingUid(u.id);setRenameVal(u.name);}}
                    onMouseEnter={ev=>ev.currentTarget.style.color=C.green}
                    onMouseLeave={ev=>ev.currentTarget.style.color="#2a2a2a"}>✎</button>
                  {data.users.length>1&&<button style={{...dBtn,fontSize:14,color:"#2a2a2a",padding:"4px 6px"}}
                    onMouseDown={ev=>{ev.preventDefault();ev.stopPropagation();setModal({type:"confirm",msg:`Delete user "${u.name}" and all their data?`,onOk:()=>delUser(u.id)});}}
                    onMouseEnter={ev=>ev.currentTarget.style.color="#cc2222"}
                    onMouseLeave={ev=>ev.currentTarget.style.color="#2a2a2a"}>✕</button>}
                </div>
              );
            })}
            <div style={{padding:"10px 18px",fontSize:13,color:"#2a5000",cursor:"pointer",fontWeight:600,borderTop:"1px solid #141414"}}
              onMouseDown={e=>e.stopPropagation()}
              onClick={()=>setModal({type:"addUser"})}>+ Add User</div>
          </>}
        </div>

        {/* ── EXERCISES SECTION ── */}
        <div>
          <SectionHeader label={`Exercises · ${activeUser?.name||""}`} open={exercisesOpen} onToggle={()=>setExercisesOpen(o=>!o)}/>
          {exercisesOpen&&<>
            {/* Search bar */}
            <div style={{padding:"8px 14px",borderBottom:"1px solid #141414"}}
              onMouseDown={e=>e.stopPropagation()}>
              <div style={{position:"relative",display:"flex",alignItems:"center"}}>
                <span style={{position:"absolute",left:13,fontSize:14,color:"#3a3a3a",pointerEvents:"none"}}>⌕</span>
                <input
                  style={{...inp,marginBottom:0,paddingLeft:36,background:"#0a0a0a",border:"1px solid #1e1e1e",fontSize:13}}
                  placeholder="Search exercises…"
                  value={sbSearch}
                  onChange={e=>setSbSearch(e.target.value)}
                />
                {sbSearch&&<button
                  style={{position:"absolute",right:10,background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:16,padding:"4px",lineHeight:1}}
                  onMouseDown={e=>{e.preventDefault();e.stopPropagation();setSbSearch("");}}>✕</button>}
              </div>
            </div>

            {allExFiltered ? (
              <div>
                {allExFiltered.length===0&&<div style={{...mpt,fontSize:12}}>No exercises match<br/>"{sbSearch}"</div>}
                {allExFiltered.map(e=>{
                  const last=sortSess(e.sessions)[0];
                  const maxW=last?.sets.filter(s=>s.weight!=null).length?Math.max(...last.sets.filter(s=>s.weight!=null).map(s=>s.weight)):0;
                  return(
                    <div key={`${e.mId}/${e.id}`}
                      style={{display:"flex",alignItems:"center",padding:"9px 18px",borderBottom:"1px solid #111"}}
                      onMouseDown={ev=>ev.stopPropagation()}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,color:"#bbb",cursor:"pointer",marginBottom:2}}
                          onMouseDown={ev=>{ev.stopPropagation();setSidebar(false);setViewEx({mId:e.mId,eId:e.id});setScreen("exHistory");}}>
                          {hiText(e.name)}
                        </div>
                        <div style={{fontSize:10,color:"#383838"}}>{e.mName}{maxW>0?` · ${maxW}kg`:""}</div>
                      </div>
                      <button style={{...dBtn,fontSize:13,color:"#2a2a2a",marginRight:2}}
                        onMouseDown={ev=>{ev.preventDefault();ev.stopPropagation();setModal({type:"editEx",mId:e.mId,eId:e.id,current:e.name});}}
                        onMouseEnter={ev=>ev.currentTarget.style.color="#c8f72c"}
                        onMouseLeave={ev=>ev.currentTarget.style.color="#2a2a2a"}>✎</button>
                      <button style={{...dBtn,fontSize:14,color:"#2a2a2a"}}
                        onMouseDown={ev=>{ev.preventDefault();ev.stopPropagation();setModal({type:"confirm",msg:`Delete "${e.name}" and all its sessions?`,onOk:()=>delEx(e.mId,e.id)});}}
                        onMouseEnter={ev=>ev.currentTarget.style.color="#cc2222"}
                        onMouseLeave={ev=>ev.currentTarget.style.color="#2a2a2a"}>✕</button>
                    </div>
                  );
                })}
              </div>
            ) : (
              muscles.map(m=>(
                <div key={m.id} style={{borderBottom:"1px solid #141414"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 18px",cursor:"pointer"}}
                    onMouseDown={e=>{e.stopPropagation();setSbOpen(o=>({...o,[m.id]:!o[m.id]}));}}>
                    <MuscleIcon muscle={m.name} size={28}/>
                    <span style={{fontSize:16,fontWeight:700,color:"#ddd",flex:1,letterSpacing:0.5}}>{m.name}</span>
                    <span style={{fontSize:11,color:"#3a3a3a",marginRight:6}}>{m.exercises.length}</span>
                    <span style={{fontSize:11,color:"#3a3a3a"}}>{sbOpen[m.id]?"▲":"▼"}</span>
                  </div>
                  {sbOpen[m.id]&&(
                    <div style={{paddingBottom:4}}>
                      {sortEx(m.exercises).map(e=>{
                        const last=sortSess(e.sessions)[0];
                        const maxW=last?.sets.filter(s=>s.weight!=null).length?Math.max(...last.sets.filter(s=>s.weight!=null).map(s=>s.weight)):0;
                        return(
                          <div key={e.id}
                            style={{display:"flex",alignItems:"center",padding:"8px 18px 8px 58px",borderTop:"1px solid #111"}}
                            onMouseDown={e=>e.stopPropagation()}>
                            <span style={{flex:1,fontSize:12,color:"#888",cursor:"pointer"}}
                              onMouseDown={ev=>{ev.stopPropagation();setSidebar(false);setViewEx({mId:m.id,eId:e.id});setScreen("exHistory");}}>
                              {e.name}
                            </span>
                            {maxW>0&&<span style={{fontSize:10,color:"#2a2a2a",marginRight:8}}>{maxW}kg</span>}
                            <button style={{...dBtn,fontSize:13,color:"#2a2a2a",marginRight:2}}
                              onMouseDown={ev=>{ev.preventDefault();ev.stopPropagation();setModal({type:"editEx",mId:m.id,eId:e.id,current:e.name});}}
                              onMouseEnter={ev=>ev.currentTarget.style.color="#c8f72c"}
                              onMouseLeave={ev=>ev.currentTarget.style.color="#2a2a2a"}>✎</button>
                            <button style={{...dBtn,fontSize:14,color:"#2a2a2a"}}
                              onMouseDown={ev=>{ev.preventDefault();ev.stopPropagation();setModal({type:"confirm",msg:`Delete "${e.name}" and all its sessions?`,onOk:()=>delEx(m.id,e.id)});}}
                              onMouseEnter={ev=>ev.currentTarget.style.color="#cc2222"}
                              onMouseLeave={ev=>ev.currentTarget.style.color="#2a2a2a"}>✕</button>
                          </div>
                        );
                      })}
                      <div style={{padding:"8px 18px 8px 58px",fontSize:12,color:"#2a5000",cursor:"pointer",borderTop:"1px solid #111",fontWeight:600}}
                        onMouseDown={e=>{e.stopPropagation();setModal({type:"addEx",mId:m.id});}}>+ Add exercise</div>
                      <div style={{padding:"8px 18px 8px 58px",fontSize:12,color:"#5a1800",cursor:"pointer",borderTop:"1px solid #111",fontWeight:600}}
                        onMouseDown={e=>{e.stopPropagation();setModal({type:"confirm",msg:`Delete "${m.name}" and all its data?`,onOk:()=>delMuscle(m.id)});}}>− Delete muscle</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </>}
        </div>

      </div>

      {/* Fixed bottom area */}
      <div style={{flexShrink:0,borderTop:"1px solid #1a1a1a",background:"#0f0f0f",padding:"12px 18px 8px"}}>
        <button style={{...btn(true),display:"block",width:"100%",fontSize:15,padding:"14px"}}
          onMouseDown={e=>{e.stopPropagation();setModal({type:"addMuscle"});}}>+ Add Muscle Group</button>
        <button style={{...btn(),display:"block",width:"100%",fontSize:13,padding:"12px",marginTop:8}}
          onMouseDown={e=>{e.stopPropagation();setSidebar(false);setModal({type:"backup"});}}>⤓ Backup / Restore</button>
      </div>
      <div style={{textAlign:"center",padding:"6px 20px 34px",fontSize:12,color:"#555",letterSpacing:2,...T,flexShrink:0,background:"#0f0f0f"}}>
        CREATED WITH ❤️ BY{" "}
        <a href="https://www.linkedin.com/in/prasadrpatil" target="_blank" rel="noreferrer"
          style={{color:C.green,textDecoration:"none",letterSpacing:2}}
          onMouseDown={e=>e.stopPropagation()}>PRASAD</a>
      </div>
    </div>
  </>;
}

export default Sidebar;
