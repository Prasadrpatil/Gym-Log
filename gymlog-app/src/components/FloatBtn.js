import { C, T } from "../theme";

// ── Floating action button — scroll-aware ────────────────
// Appears at bottom-center, disappears on scroll down, reappears on scroll up
function FloatBtn({label, onClick, visible, right=false, left=false}){
  const base={
    position:"fixed", bottom:34, zIndex:15,
    background:C.green, border:"none", color:"#000",
    borderRadius:28, padding:"16px 28px",
    fontSize:15, fontWeight:700, letterSpacing:1,...T,
    cursor:"pointer", boxShadow:"0 4px 24px rgba(200,247,44,0.3)",
    transition:"opacity 0.25s, transform 0.25s",
    opacity: visible?1:0,
    transform: visible?"translateY(0)":"translateY(20px)",
    pointerEvents: visible?"auto":"none",
    textTransform:"uppercase",
    whiteSpace:"nowrap",
  };
  if(left)  base.left="14px";
  else if(right) base.right="14px";
  else { base.left="50%"; base.transform=(visible?"translateX(-50%)":"translateX(-50%) translateY(20px)"); }
  return <button style={base} onClick={onClick}>{label}</button>;
}

export default FloatBtn;
