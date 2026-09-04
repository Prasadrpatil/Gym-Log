function SectionHeader({label,open,onToggle}){
  return (
    <div style={{display:"flex",alignItems:"center",padding:"12px 18px",cursor:"pointer",
      background:"#0c0c0c",borderBottom:`1px solid #1a1a1a`,userSelect:"none"}}
      onMouseDown={e=>e.stopPropagation()} onClick={onToggle}>
      <span style={{fontSize:10,letterSpacing:3,color:"#555",textTransform:"uppercase",flex:1,fontWeight:700}}>{label}</span>
      <span style={{fontSize:11,color:"#333"}}>{open?"▲":"▼"}</span>
    </div>
  );
}

export default SectionHeader;
