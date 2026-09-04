import React from "react";
import { useApp } from "../context";

function AnatomyModal(){
  const {setScreen,setAnatomyOpen} = useApp();


  const [scale,setScale]=React.useState(1);
  const [offset,setOffset]=React.useState({x:0,y:0});
  const lastPinch=React.useRef(null);
  const lastDrag=React.useRef(null);
  const isDragging=React.useRef(false);
  const imgRef=React.useRef(null);

  function clampOffset(x,y,sc){
    const el=imgRef.current;
    if(!el) return {x,y};
    const pw=el.parentElement.offsetWidth;
    const ph=el.parentElement.offsetHeight;
    const iw=el.offsetWidth*sc;
    const ih=el.offsetHeight*sc;
    const maxX=Math.max(0,(iw-pw)/2);
    const maxY=Math.max(0,(ih-ph)/2);
    return {x:Math.min(maxX,Math.max(-maxX,x)), y:Math.min(maxY,Math.max(-maxY,y))};
  }

  function onTouchStart(e){
    if(e.touches.length===2){
      const dx=e.touches[0].clientX-e.touches[1].clientX;
      const dy=e.touches[0].clientY-e.touches[1].clientY;
      lastPinch.current={dist:Math.hypot(dx,dy),scale,offset};
      lastDrag.current=null;
    } else if(e.touches.length===1){
      lastDrag.current={x:e.touches[0].clientX,y:e.touches[0].clientY,ox:offset.x,oy:offset.y};
      lastPinch.current=null;
    }
  }
  function onTouchMove(e){
    e.preventDefault();
    if(e.touches.length===2&&lastPinch.current){
      const dx=e.touches[0].clientX-e.touches[1].clientX;
      const dy=e.touches[0].clientY-e.touches[1].clientY;
      const dist=Math.hypot(dx,dy);
      const newScale=Math.min(6,Math.max(1,lastPinch.current.scale*(dist/lastPinch.current.dist)));
      const clamped=clampOffset(lastPinch.current.offset.x,lastPinch.current.offset.y,newScale);
      setScale(newScale);
      setOffset(clamped);
    } else if(e.touches.length===1&&lastDrag.current&&scale>1){
      const dx=e.touches[0].clientX-lastDrag.current.x;
      const dy=e.touches[0].clientY-lastDrag.current.y;
      setOffset(clampOffset(lastDrag.current.ox+dx,lastDrag.current.oy+dy,scale));
    }
  }
  function onTouchEnd(e){
    if(e.touches.length<2) lastPinch.current=null;
    if(e.touches.length===0) lastDrag.current=null;
  }
  function onDblTap(){
    if(scale>1){setScale(1);setOffset({x:0,y:0});}
    else{setScale(2.5);setOffset({x:0,y:0});}
  }
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,background:"#000",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"44px 18px 12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",
        background:"#0a0a0a",borderBottom:"1px solid #1a1a1a",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button style={{background:"none",border:"1px solid #2a2a2a",color:"#777",borderRadius:6,padding:"10px 14px",cursor:"pointer",fontSize:12,fontFamily:"inherit",letterSpacing:1,flexShrink:0}}
            onClick={()=>{setAnatomyOpen(false);setScreen("home");}}>← Back</button>
          <div>
            <div style={{fontSize:16,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#e8e8e8"}}>Human Anatomy</div>
            <div style={{fontSize:10,color:"#333",letterSpacing:2,marginTop:2}}>PINCH TO ZOOM · DOUBLE TAP TO RESET</div>
          </div>
        </div>
      </div>
      <div style={{flex:1,overflow:"hidden",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
        touchAction:"none",userSelect:"none"}}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={onDblTap}>
        <img ref={imgRef}
          src={process.env.PUBLIC_URL+"/anatomy.png"}
          alt="Human Anatomy"
          style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",
            transform:"translate("+offset.x+"px,"+offset.y+"px) scale("+scale+")",
            transformOrigin:"center center",
            transition:lastPinch.current||lastDrag.current?"none":"transform 0.2s ease",
            imageRendering:"crisp-edges",
            display:"block"}}
          draggable={false}
        />
      </div>
      <div style={{textAlign:"center",padding:"8px",fontSize:10,color:"#222",background:"#0a0a0a",flexShrink:0}}>
        {scale>1?"Drag to pan · Double tap to reset":"Pinch to zoom · Double tap to zoom in"}
      </div>
    </div>
  );
}

export default AnatomyModal;
