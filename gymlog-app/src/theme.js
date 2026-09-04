// ── Constants ────────────────────────────────────────────────
const C = {green:"#c8f72c",bg:"#0a0a0a",card:"#111",border:"#1a1a1a",text:"#e8e8e8",muted:"#484848",dim:"#2a2a2a",red:"#e8341a"};
const T = {fontFamily:"'DM Mono','Courier New',monospace"};

// ── Design tokens ──────────────────────────────────────────
const hdr={background:"#0f0f0f",borderBottom:`1px solid ${C.border}`,padding:"44px 18px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:20};
const ttl={fontSize:15,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:C.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"};
const sub={fontSize:10,color:"#3a3a3a",letterSpacing:2,textTransform:"uppercase",marginTop:5};
const bkBtn={background:"none",border:"1px solid #2a2a2a",color:"#777",borderRadius:6,padding:"10px 14px",cursor:"pointer",fontSize:12,...T,letterSpacing:1,flexShrink:0};
const mnBtn={background:"none",border:"1px solid #2a2a2a",color:"#888",borderRadius:6,padding:"10px 14px",cursor:"pointer",fontSize:17,...T,flexShrink:0,lineHeight:1};
const crd={background:C.card,border:`1px solid ${C.border}`,borderRadius:10,margin:"8px 14px",padding:"14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"};
const dBtn={background:"none",border:"none",color:"#252525",cursor:"pointer",fontSize:18,padding:"6px 10px",borderRadius:4,lineHeight:1,flexShrink:0};
const sRow={background:C.card,border:"1px solid #171717",borderRadius:8,padding:"12px 14px",margin:"5px 14px",display:"flex",alignItems:"center",gap:8};
const inp={width:"100%",background:C.bg,border:"1px solid #1e1e1e",borderRadius:8,color:C.text,padding:"13px",fontSize:14,...T,marginBottom:10,outline:"none",boxSizing:"border-box"};
const rw={display:"flex",gap:8};
const btn=(a,d)=>({flex:1,padding:"14px",borderRadius:8,border:"none",background:d?"#280000":a?C.green:"#181818",color:d?"#ff4444":a?"#000":"#666",...T,fontSize:12,fontWeight:700,letterSpacing:1,cursor:"pointer",textTransform:"uppercase"});
const mpt={textAlign:"center",padding:"60px 20px",color:"#1e1e1e",fontSize:11,letterSpacing:2,textTransform:"uppercase",lineHeight:2.4};
const sLbl={fontSize:10,letterSpacing:3,color:"#2a2a2a",textTransform:"uppercase",padding:"18px 14px 8px"};

const mTtl={fontSize:11,letterSpacing:3,color:"#444",textTransform:"uppercase",marginBottom:16};

export { C, T, hdr, ttl, sub, bkBtn, mnBtn, crd, dBtn, sRow, inp, rw, btn, mpt, sLbl, mTtl };
