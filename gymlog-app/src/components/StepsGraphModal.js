import { useState, useRef } from "react";
import { useApp } from "../context";
import { C, T } from "../theme";
import { localISO, shortDate } from "../dates";

function StepsGraphModal({onClose}){
  const {dailySteps} = useApp();
  const [selected, setSelected] = useState(null);
  const svgRef = useRef(null);

  const today = new Date();
  const points = [];
  for(let i=29; i>=0; i--){
    const d = new Date(today);
    d.setDate(today.getDate()-i);
    const iso = localISO(d);
    const steps = dailySteps[iso];
    if(steps!=null) points.push({date:iso, steps, idx:29-i});
  }

  const W=320, H=180, PAD={top:16,right:16,bottom:40,left:52};
  const plotW=W-PAD.left-PAD.right;
  const plotH=H-PAD.top-PAD.bottom;

  const vals = points.map(p=>p.steps);
  const minV = vals.length ? 0 : 0;
  const maxV = vals.length ? Math.ceil(Math.max(...vals)*1.1/1000)*1000 : 10000;
  const range = maxV - minV || 1;

  function xOf(idx){ return PAD.left+(idx/29)*plotW; }
  function yOf(v){ return PAD.top+plotH-((v-minV)/range)*plotH; }

  const linePoints = points.map(p=>`${xOf(p.idx)},${yOf(p.steps)}`).join(" ");
  const areaPoints = points.length>=2
    ? `${xOf(points[0].idx)},${PAD.top+plotH} `+linePoints+` ${xOf(points[points.length-1].idx)},${PAD.top+plotH}`
    : "";

  const yTicks = [];
  const tickStep = maxV<=5000?1000:maxV<=10000?2000:5000;
  for(let v=0; v<=maxV; v+=tickStep) yTicks.push(v);

  const xLabels=[];
  [0,7,14,21,29].forEach(i=>{
    const d=new Date(today);
    d.setDate(today.getDate()-(29-i));
    xLabels.push({idx:i, label:d.toLocaleDateString("en-US",{month:"short",day:"numeric"})});
  });

  function fmtSteps(n){ return n>=1000?`${(n/1000).toFixed(1)}k`:String(n); }

  function handleClick(e){
    if(!svgRef.current||points.length===0) return;
    const rect=svgRef.current.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*(W/rect.width);
    let best=null,bestDist=Infinity;
    points.forEach(p=>{
      const d=Math.abs(xOf(p.idx)-mx);
      if(d<bestDist){bestDist=d;best=p;}
    });
    if(best&&bestDist<40) setSelected(s=>s?.date===best.date?null:best);
    else setSelected(null);
  }


  return(
    <div style={{position:"fixed",inset:0,zIndex:60,background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:"#0f0f0f",borderBottom:"1px solid #1a1a1a",padding:"44px 18px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button style={{background:"none",border:"1px solid #2a2a2a",color:"#777",borderRadius:6,padding:"10px 14px",cursor:"pointer",fontSize:12,...T,letterSpacing:1,flexShrink:0}}
          onClick={onClose}>← Back</button>
        <div style={{fontSize:16,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:C.text}}>Steps Graph</div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 18px 40px"}}>
        <div style={{fontSize:10,color:"#3a3a3a",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>Last 30 days</div>

        {selected?(
          <div style={{background:"#0d1400",border:"1px solid #1e3000",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:28,fontWeight:700,color:C.green,letterSpacing:-1}}>{fmtSteps(selected.steps)}<span style={{fontSize:12,color:"#4a7a00",fontWeight:400}}> steps</span></div>
            <div>
              <div style={{fontSize:12,color:C.text,fontWeight:600}}>{shortDate(selected.date)}</div>
              <div style={{fontSize:10,color:"#4a6a00",marginTop:2,letterSpacing:1}}>tap again to deselect</div>
            </div>
          </div>
        ):(
          <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:10,padding:"12px 16px",marginBottom:16,
            fontSize:10,color:"#3a3a3a",letterSpacing:1,textTransform:"uppercase",textAlign:"center"}}>
            {points.length>0?"Tap graph to inspect a point":"No step data yet — log steps from any day's view"}
          </div>
        )}

        {points.length>0?(
          <div style={{background:"#0c0c0c",border:"1px solid #1a1a1a",borderRadius:12,overflow:"hidden",padding:"8px 0 4px"}}>
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%"
              style={{display:"block",cursor:"crosshair",touchAction:"none"}}
              onClick={handleClick}>
              {yTicks.map(v=>(
                <line key={v} x1={PAD.left} x2={PAD.left+plotW} y1={yOf(v)} y2={yOf(v)} stroke="#1a1a1a" strokeWidth="1"/>
              ))}
              {areaPoints&&<polygon points={areaPoints} fill="#c8f72c" fillOpacity="0.07"/>}
              {points.length>=2&&(
                <polyline points={linePoints} fill="none" stroke="#c8f72c" strokeWidth="2"
                  strokeLinejoin="round" strokeLinecap="round"/>
              )}
              {points.map(p=>{
                const isSel=selected?.date===p.date;
                return(
                  <g key={p.date}>
                    {isSel&&<circle cx={xOf(p.idx)} cy={yOf(p.steps)} r="10" fill="#c8f72c" fillOpacity="0.15"/>}
                    <circle cx={xOf(p.idx)} cy={yOf(p.steps)} r={isSel?5:3}
                      fill={isSel?"#c8f72c":"#8aaa40"} stroke="#0c0c0c" strokeWidth="1.5"/>
                  </g>
                );
              })}
              {selected&&(
                <line x1={xOf(selected.idx)} x2={xOf(selected.idx)}
                  y1={PAD.top} y2={PAD.top+plotH}
                  stroke="#c8f72c" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5"/>
              )}
              {yTicks.map(v=>(
                <text key={v} x={PAD.left-5} y={yOf(v)+4} textAnchor="end"
                  fill="#3a3a3a" fontSize="9" fontFamily="monospace">{fmtSteps(v)}</text>
              ))}
              {xLabels.map(({idx,label})=>(
                <text key={idx} x={xOf(idx)} y={H-6} textAnchor="middle"
                  fill="#3a3a3a" fontSize="8" fontFamily="monospace">{label}</text>
              ))}
              <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top+plotH} stroke="#2a2a2a" strokeWidth="1"/>
              <line x1={PAD.left} x2={PAD.left+plotW} y1={PAD.top+plotH} y2={PAD.top+plotH} stroke="#2a2a2a" strokeWidth="1"/>
            </svg>
          </div>
        ):(
          <div style={{background:"#0c0c0c",border:"1px solid #1a1a1a",borderRadius:12,padding:"60px 20px",
            textAlign:"center",color:"#2a2a2a",fontSize:11,letterSpacing:2,textTransform:"uppercase"}}>
            No step data<br/>in the last 30 days
          </div>
        )}

        {points.length>=2&&(()=>{
          const avg=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
          const best=Math.max(...vals);
          const diff=vals[vals.length-1]-vals[0];
          const diffColor=diff>=0?C.green:"#e85d2a";
          return(
            <div style={{display:"flex",gap:10,marginTop:14}}>
              {[
                {label:"Avg",value:fmtSteps(avg)},
                {label:"Best",value:fmtSteps(best)},
                {label:"Trend",value:`${diff>=0?"+":""}${fmtSteps(Math.abs(diff))}`,color:diffColor},
              ].map(st=>(
                <div key={st.label} style={{flex:1,background:"#0c0c0c",border:"1px solid #1a1a1a",borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                  <div style={{fontSize:15,fontWeight:700,color:st.color||C.text}}>{st.value}</div>
                  <div style={{fontSize:8,color:"#3a3a3a",letterSpacing:2,textTransform:"uppercase",marginTop:3}}>{st.label}</div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default StepsGraphModal;
