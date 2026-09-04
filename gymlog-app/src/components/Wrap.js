import { useApp } from "../context";
import { T } from "../theme";

// ── Modal wrapper ────────────────────────────────────────
function Wrap({children}){
  const {setModal} = useApp();
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200}}
      onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null);}}>
      <div style={{background:"#111",border:"1px solid #222",borderRadius:"16px 16px 0 0",padding:"24px 18px 36px",width:"100%",maxWidth:500,...T}}
        onMouseDown={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default Wrap;
