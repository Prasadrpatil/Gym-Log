import { useState, useRef } from "react";
import { useApp } from "../context";
import { C, T } from "../theme";
import { localISO, shortDate } from "../dates";

function BodyWeightModal({onClose}){
  const {dailyWeights} = useApp();
  const [selected, setSelected] = useState(null); // {date, kg}
  const svgRef = useRef(null);

  // Build last-30-days data
  const today = new Date();
  const points = [];
  for(let i=29; i>=0; i--){
    const d = new Date(today);
    d.setDate(today.getDate()-i);
    const iso = localISO(d);
    const kg = dailyWeights[iso];
    if(kg!=null) points.push({date:iso, kg, idx:29-i});
  }

  // X/Y layout
  const W=320, H=180, PAD={top:16,right:16,bottom:40,left:44};
  const plotW=W-PAD.left-PAD.right;
  const plotH=H-PAD.top-PAD.bottom;

  const kgVals = points.map(p=>p.kg);
  const minKg = kgVals.length ? Math.floor(Math.min(...kgVals)-1) : 50;
  const maxKg = kgVals.length ? Math.ceil(Math.max(...kgVals)+1) : 100;
  const rangeKg = maxKg - minKg || 1;

  function xOf(idx){ return PAD.left + (idx/29)*plotW; }
  function yOf(kg){ return PAD.top + plotH - ((kg-minKg)/rangeKg)*plotH; }

  // Build SVG polyline
  const linePoints = points.map(p=>`${xOf(p.idx)},${yOf(p.kg)}`).join(" ");
  const areaPoints = points.length>=2
    ? `${xOf(points[0].idx)},${PAD.top+plotH} `+linePoints+` ${xOf(points[points.length-1].idx)},${PAD.top+plotH}`
    : "";

  // Y-axis ticks
  const yTicks = [];
  const step = rangeKg<=10?1:rangeKg<=20?2:5;
  for(let v=Math.ceil(minKg/step)*step; v<=maxKg; v+=step){
    yTicks.push(v);
  }

  // X-axis: show ~5 evenly-spaced dates
  const xLabels=[];
  const labelIdxs=[0,7,14,21,29];
  labelIdxs.forEach(i=>{
    const d=new Date(today);
    d.setDate(today.getDate()-(29-i));
    xLabels.push({idx:i, label:d.toLocaleDateString("en-US",{month:"short",day:"numeric"})});
  });

  // Click on SVG → find nearest point
  function handleSvgClick(e){
    if(!svgRef.current||points.length===0) return;
    const rect=svgRef.current.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*(W/rect.width);
    // Find nearest point by x distance
    let best=null, bestDist=Infinity;
    points.forEach(p=>{
      const d=Math.abs(xOf(p.idx)-mx);
      if(d<bestDist){bestDist=d;best=p;}
    });
    if(best&&bestDist<40){
      setSelected(sel=>sel?.date===best.date?null:best);
    } else {
      setSelected(null);
    }
  }


  return(
    <div style={{position:"fixed",inset:0,zIndex:60,background:C.bg,display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{background:"#0f0f0f",borderBottom:"1px solid #1a1a1a",padding:"44px 18px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button style={{background:"none",border:"1px solid #2a2a2a",color:"#777",borderRadius:6,padding:"10px 14px",cursor:"pointer",fontSize:12,...T,letterSpacing:1,flexShrink:0}}
          onClick={onClose}>← Back</button>
        <div style={{fontSize:16,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:C.text}}>Body Weight</div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 18px 40px"}}>

        {/* Subtitle */}
        <div style={{fontSize:10,color:"#3a3a3a",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>Last 30 days</div>

        {/* Selected point info */}
        {selected?(
          <div style={{background:"#0d1400",border:"1px solid #1e3000",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:28,fontWeight:700,color:C.green,letterSpacing:-1}}>{selected.kg}<span style={{fontSize:12,color:"#4a7a00",fontWeight:400}}> kg</span></div>
            <div>
              <div style={{fontSize:12,color:C.text,fontWeight:600}}>{shortDate(selected.date)}</div>
              <div style={{fontSize:10,color:"#4a6a00",marginTop:2,letterSpacing:1}}>tap again to deselect</div>
            </div>
          </div>
        ):(
          <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:10,padding:"12px 16px",marginBottom:16,
            fontSize:10,color:"#3a3a3a",letterSpacing:1,textTransform:"uppercase",textAlign:"center"}}>
            {points.length>0?"Tap graph to inspect a point":"No data yet — log weight from any day's view"}
          </div>
        )}

        {/* Graph */}
        {points.length>0?(
          <div style={{background:"#0c0c0c",border:"1px solid #1a1a1a",borderRadius:12,overflow:"hidden",padding:"8px 0 4px"}}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              width="100%"
              style={{display:"block",cursor:"crosshair",touchAction:"none"}}
              onClick={handleSvgClick}
            >
              {/* Grid lines */}
              {yTicks.map(v=>(
                <line key={v} x1={PAD.left} x2={PAD.left+plotW} y1={yOf(v)} y2={yOf(v)}
                  stroke="#1a1a1a" strokeWidth="1"/>
              ))}
              {/* Area fill */}
              {areaPoints&&(
                <polygon points={areaPoints} fill="#c8f72c" fillOpacity="0.07"/>
              )}
              {/* Line */}
              {points.length>=2&&(
                <polyline points={linePoints} fill="none" stroke="#c8f72c" strokeWidth="2"
                  strokeLinejoin="round" strokeLinecap="round"/>
              )}
              {/* Dots */}
              {points.map(p=>{
                const isSel=selected?.date===p.date;
                return(
                  <g key={p.date}>
                    {isSel&&<circle cx={xOf(p.idx)} cy={yOf(p.kg)} r="10" fill="#c8f72c" fillOpacity="0.15"/>}
                    <circle cx={xOf(p.idx)} cy={yOf(p.kg)} r={isSel?5:3}
                      fill={isSel?"#c8f72c":"#8aaa40"} stroke="#0c0c0c" strokeWidth="1.5"/>
                  </g>
                );
              })}
              {/* Selected vertical line */}
              {selected&&(
                <line x1={xOf(selected.idx)} x2={xOf(selected.idx)}
                  y1={PAD.top} y2={PAD.top+plotH}
                  stroke="#c8f72c" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5"/>
              )}
              {/* Y-axis labels */}
              {yTicks.map(v=>(
                <text key={v} x={PAD.left-5} y={yOf(v)+4} textAnchor="end"
                  fill="#3a3a3a" fontSize="9" fontFamily="monospace">{v}</text>
              ))}
              {/* X-axis labels */}
              {xLabels.map(({idx,label})=>(
                <text key={idx} x={xOf(idx)} y={H-6} textAnchor="middle"
                  fill="#3a3a3a" fontSize="8" fontFamily="monospace">{label}</text>
              ))}
              {/* Y axis line */}
              <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top+plotH} stroke="#2a2a2a" strokeWidth="1"/>
              {/* X axis line */}
              <line x1={PAD.left} x2={PAD.left+plotW} y1={PAD.top+plotH} y2={PAD.top+plotH} stroke="#2a2a2a" strokeWidth="1"/>
            </svg>
          </div>
        ):(
          <div style={{background:"#0c0c0c",border:"1px solid #1a1a1a",borderRadius:12,padding:"60px 20px",
            textAlign:"center",color:"#2a2a2a",fontSize:11,letterSpacing:2,textTransform:"uppercase"}}>
            No weight data<br/>in the last 30 days
          </div>
        )}

        {/* Summary stats */}
        {points.length>=2&&(()=>{
          const avg=(points.reduce((a,p)=>a+p.kg,0)/points.length).toFixed(1);
          const diff=(points[points.length-1].kg-points[0].kg).toFixed(1);
          const diffColor=diff<0?C.green:diff>0?"#e85d2a":C.muted;
          return(
            <div style={{display:"flex",gap:10,marginTop:14}}>
              {[
                {label:"Avg",value:`${avg} kg`},
                {label:"Change",value:`${diff>0?"+":""}${diff} kg`,color:diffColor},
                {label:"Entries",value:points.length},
              ].map(st=>(
                <div key={st.label} style={{flex:1,background:"#0c0c0c",border:"1px solid #1a1a1a",borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                  <div style={{fontSize:15,fontWeight:700,color:st.color||C.text,letterSpacing:-0.5}}>{st.value}</div>
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

export default BodyWeightModal;
