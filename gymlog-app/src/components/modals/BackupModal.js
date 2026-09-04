import { useState } from "react";
import { useApp } from "../../context";
import { C, T, mTtl, rw, btn, inp } from "../../theme";
import { localISO } from "../../dates";
import Wrap from "../Wrap";

// ── BACKUP ───────────────────────────────────────────────
// Everything lives in WebView localStorage inside the app sandbox: clearing
// app data or switching phones wipes the whole history with no way back.
function BackupModal(){
  const {data,setModal,replaceData} = useApp();
  const [tab,setTab]=useState("export");
  const [paste,setPaste]=useState("");
  const [note,setNote]=useState(null);
  const json=JSON.stringify(data);
  const filename=`gymlog-backup-${localISO()}.json`;

  const copy=async()=>{
    try{
      await navigator.clipboard.writeText(json);
      setNote({ok:true,msg:"Backup copied to clipboard — paste it somewhere safe."});
    }catch{
      setNote({ok:false,msg:"Could not copy. Long-press the text below to select and copy it."});
    }
  };
  const share=async()=>{
    try{
      const file=new File([json],filename,{type:"application/json"});
      if(navigator.canShare?.({files:[file]})) { await navigator.share({files:[file],title:filename}); return; }
      if(navigator.share){ await navigator.share({title:filename,text:json}); return; }
      copy();
    }catch{ /* user dismissed the sheet */ }
  };
  const doImport=()=>{
    let parsed;
    try{ parsed=JSON.parse(paste); }
    catch{ setNote({ok:false,msg:"That isn't valid JSON."}); return; }
    if(!parsed?.users?.length){ setNote({ok:false,msg:"No users found — this doesn't look like a GymLog backup."}); return; }
    const days=new Set();
    parsed.users.forEach(u=>(u.muscles||[]).forEach(m=>m.exercises?.forEach(e=>e.sessions?.forEach(s=>s.sets?.length&&days.add(s.date)))));
    setModal({type:"confirm",
      msg:`Replace ALL current data with this backup? ${parsed.users.length} user(s), ${days.size} training day(s). Your current data will be gone.`,
      onOk:()=>replaceData(parsed)});
  };

  const tabStyle=t=>({flex:1,padding:"10px 4px",border:"none",borderRadius:6,cursor:"pointer",
    fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",...T,
    background:tab===t?C.green:"#181818",color:tab===t?"#000":"#555"});

  return <Wrap>
    <div style={mTtl}>Backup</div>
    <div style={{display:"flex",gap:6,marginBottom:14}}>
      <button style={tabStyle("export")} onMouseDown={e=>{e.stopPropagation();setTab("export");setNote(null);}}>Export</button>
      <button style={tabStyle("import")} onMouseDown={e=>{e.stopPropagation();setTab("import");setNote(null);}}>Import</button>
    </div>

    {tab==="export"?<>
      <div style={{fontSize:11,color:"#555",lineHeight:1.6,marginBottom:12}}>
        {filename} · {(json.length/1024).toFixed(1)} KB
      </div>
      <div style={rw}>
        <button style={btn()} onMouseDown={e=>{e.stopPropagation();copy();}}>Copy</button>
        <button style={btn(true)} onMouseDown={e=>{e.stopPropagation();share();}}>Share / Save</button>
      </div>
      <textarea readOnly value={json} onFocus={e=>e.target.select()}
        style={{...inp,marginTop:10,height:110,resize:"none",fontSize:9,color:"#555",lineHeight:1.4}}/>
    </>:<>
      <div style={{fontSize:11,color:"#555",lineHeight:1.6,marginBottom:10}}>
        Paste a backup below. This replaces everything currently in the app.
      </div>
      <textarea value={paste} onChange={e=>{setPaste(e.target.value);setNote(null);}}
        placeholder='{"users":[…]}'
        style={{...inp,height:110,resize:"none",fontSize:10,lineHeight:1.4}}/>
      <div style={rw}>
        <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
        <button style={btn(true,!paste.trim())} onMouseDown={e=>{e.stopPropagation();doImport();}}>Import</button>
      </div>
    </>}

    {note&&(
      <div style={{marginTop:12,fontSize:11,lineHeight:1.5,color:note.ok?"#6a9a00":"#e85d2a"}}>{note.msg}</div>
    )}
    {tab==="export"&&(
      <button style={{...btn(),marginTop:10}} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Close</button>
    )}
  </Wrap>;
}

export default BackupModal;
