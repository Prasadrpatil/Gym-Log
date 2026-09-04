import { useState, useEffect, useRef } from "react";

function useScrollVisible(containerRef){
  const [visible,setVisible]=useState(true);
  const lastY=useRef(0);
  useEffect(()=>{
    const el=containerRef.current;
    if(!el) return;
    const fn=()=>{
      const y=el.scrollTop;
      if(y<60){ setVisible(true); lastY.current=y; return; }
      setVisible(y<lastY.current);
      lastY.current=y;
    };
    el.addEventListener("scroll",fn,{passive:true});
    return ()=>el.removeEventListener("scroll",fn);
  },[]);
  return visible;
}

export default useScrollVisible;
