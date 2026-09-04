import { C, T } from "../theme";

// ── Stats bar ────────────────────────────────────────────
function StatsBar({sets}){
  const normalSets=sets.filter(s=>s.weight!=null&&s.type!=="super");
  const vol=normalSets.reduce((a,s)=>a+s.weight*s.reps,0);
  const max=normalSets.length?Math.max(...normalSets.map(s=>s.weight)):null;
  return(
    <div style={{display:"flex",borderBottom:"1px solid #131313",background:"#0d0d0d"}}>
      {[{l:"Sets",v:sets.length},{l:"Volume",v:vol?`${vol}kg`:"—"},{l:"Max",v:max!=null?`${max}kg`:"—"}].map((x,i)=>(
        <div key={x.l} style={{flex:1,padding:"14px 0",textAlign:"center",borderRight:i<2?"1px solid #131313":"none"}}>
          <div style={{fontSize:20,fontWeight:700,color:C.green,...T}}>{x.v}</div>
          <div style={{fontSize:9,color:C.dim,letterSpacing:2,textTransform:"uppercase",marginTop:2}}>{x.l}</div>
        </div>
      ))}
    </div>
  );
}

export default StatsBar;
