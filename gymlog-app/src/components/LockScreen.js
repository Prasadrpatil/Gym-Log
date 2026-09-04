import { useState, useEffect, useRef } from "react";
import { useApp } from "../context";
import { C, T } from "../theme";
import { getUnlockExp, parseToken } from "../license";

function LockScreen() {
  const {doUnlock} = useApp();
  const [tab,      setTab]    = useState("code");
  const [input,    setInput]  = useState("");
  const [err,      setErr]    = useState(null);
  const [scanning, setScanning] = useState(false);
  const [jsqrReady, setJsqrReady] = useState(!!window.jsQR);
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const timerRef   = useRef(null);
  const canvasRef  = useRef(document.createElement("canvas"));

  // Load jsQR once
  useEffect(() => {
    if (window.jsQR) { setJsqrReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    s.onload = () => setJsqrReady(true);
    document.head.appendChild(s);
    return () => { stopScan(); };
  }, []);

  function tryUnlock(token) {
    const parsed = parseToken(token);
    if (!parsed) { setErr("Invalid code. Make sure you copied the full code from KeyGen."); return; }
    if (parsed.expMs <= Date.now()) { setErr("This code has expired. Generate a new one in KeyGen."); return; }
    doUnlock(new Date(parsed.expMs).toISOString());
  }

  function tryCode() {
    tryUnlock(input);
  }

  function stopScan() {
    clearInterval(timerRef.current);
    timerRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }

  async function startScan() {
    setErr(null);
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal:"environment" }, width:{ideal:1280}, height:{ideal:720} }
      });
      streamRef.current = stream;
      await new Promise(r => setTimeout(r, 150)); // wait for video element
      const video = videoRef.current;
      if (!video) { stopScan(); return; }
      video.srcObject = stream;
      video.setAttribute("playsinline","true");
      video.muted = true;
      await video.play();

      timerRef.current = setInterval(() => {
        if (!videoRef.current || !streamRef.current) return;
        const v = videoRef.current;
        if (v.readyState < v.HAVE_ENOUGH_DATA || !v.videoWidth) return;

        const canvas = canvasRef.current;
        // Decode at 400px wide — good balance of speed and accuracy
        const scale = Math.min(1, 400 / v.videoWidth);
        canvas.width  = Math.round(v.videoWidth  * scale);
        canvas.height = Math.round(v.videoHeight * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

        if (!window.jsQR) return;
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr  = window.jsQR(img.data, img.width, img.height, { inversionAttempts:"dontInvert" });
        if (qr?.data) {
          stopScan();
          tryUnlock(qr.data);
        }
      }, 200); // scan 5× per second

    } catch(e) {
      const denied = e.name==="NotAllowedError" || e.name==="PermissionDeniedError";
      setErr(denied
        ? "Camera denied. Go to Android Settings → Apps → GymLog → Permissions → Camera → Allow."
        : `Camera error: ${e.message||e.name}`);
      setScanning(false);
    }
  }

  const inp2 = {
    background:"#0d0d0d", border:"1px solid #252525", borderRadius:10,
    color:C.text, padding:"14px", fontSize:13, ...T, outline:"none",
    width:"100%", textAlign:"center",
  };

  const exp = getUnlockExp();
  const expDt = exp ? new Date(exp) : null;
  const stillValid = expDt && expDt > new Date();

  return (
    <div style={{height:"100vh",background:C.bg,color:C.text,...T,fontSize:14,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:"0 24px",overflowY:"auto"}}>
      <style>{`input:focus{border-color:#c8f72c!important;outline:none;}`}</style>

      <div style={{marginBottom:28,textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:10}}>🔒</div>
        <div style={{fontSize:22,fontWeight:700,color:C.green,letterSpacing:3}}>GymLog</div>
        <div style={{fontSize:10,color:"#3a3a3a",letterSpacing:2,marginTop:6,textTransform:"uppercase"}}>
          Enter access code to continue
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",marginBottom:18,background:"#111",
        border:"1px solid #1e1e1e",borderRadius:10,overflow:"hidden",width:"100%",maxWidth:320}}>
        {[["code","📋 Code"],["qr","📷 Scan QR"]].map(([t,label])=>(
          <button key={t} onClick={()=>{setTab(t);setErr(null);if(t!=="qr")stopScan();}}
            style={{flex:1,padding:"12px",border:"none",cursor:"pointer",...T,
              fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",
              background:tab===t?C.green:"transparent",
              color:tab===t?"#000":"#555"}}>
            {label}
          </button>
        ))}
      </div>

      <div style={{width:"100%",maxWidth:320}}>
        {tab==="code"?(
          <>
            <div style={{position:"relative"}}>
              <input
                style={{...inp2,letterSpacing:input.trim().length>0?6:1,
                  fontSize:input.trim().length>0?18:13,
                  textAlign:"center",fontWeight:input.trim().length>0?700:"normal"}}
                type="password"
                placeholder="Paste access code"
                value={input}
                onChange={e=>{ setInput(e.target.value); setErr(null); }}
                onKeyDown={e=>{ if(e.key==="Enter") tryCode(); }}
                autoCorrect="off"
                autoCapitalize="none"
                autoComplete="new-password"
                spellCheck="false"
              />
              {input.length>0&&(
                <button onClick={()=>{setInput("");setErr(null);}}
                  style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                    background:"none",border:"none",color:"#3a3a3a",fontSize:14,cursor:"pointer",...T,
                    padding:"4px"}}>
                  ✕
                </button>
              )}
            </div>
            <button onClick={tryCode}
              style={{width:"100%",padding:"15px",marginTop:10,borderRadius:10,border:"none",
                background:input.trim().length>5?C.green:"#181818",
                color:input.trim().length>5?"#000":"#3a3a3a",
                fontSize:13,fontWeight:700,letterSpacing:2,
                cursor:"pointer",textTransform:"uppercase",...T}}>
              Unlock GymLog
            </button>
          </>
        ):(
          <>
            {!scanning?(
              <button onClick={startScan}
                style={{width:"100%",padding:"28px 20px",borderRadius:12,
                  border:`2px dashed ${jsqrReady?"#2a2a2a":"#1a1a1a"}`,
                  background:"#0d0d0d",color:jsqrReady?"#666":"#333",
                  fontSize:12,cursor:"pointer",...T,
                  display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                <span style={{fontSize:36}}>📷</span>
                <span>{jsqrReady?"Tap to scan QR code":"Loading scanner..."}</span>
                <span style={{fontSize:9,color:"#2a2a2a"}}>Point camera at QR from KeyGen app</span>
              </button>
            ):(
              <div style={{position:"relative",borderRadius:12,overflow:"hidden",
                border:"2px solid #c8f72c",aspectRatio:"1",background:"#000"}}>
                <video ref={videoRef}
                  style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                  playsInline muted autoPlay/>
                {/* Aiming reticle */}
                <div style={{position:"absolute",inset:0,display:"flex",
                  alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                  <div style={{width:"55%",height:"55%",border:"2px solid #c8f72c",
                    borderRadius:8,boxShadow:"0 0 0 9999px rgba(0,0,0,0.45)"}}/>
                </div>
                <button onClick={stopScan}
                  style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.75)",
                    border:"none",color:"#fff",borderRadius:6,padding:"6px 10px",
                    cursor:"pointer",...T,fontSize:11}}>
                  ✕
                </button>
                <div style={{position:"absolute",bottom:8,left:0,right:0,
                  textAlign:"center",fontSize:9,color:"rgba(200,247,44,0.7)",letterSpacing:1}}>
                  SCANNING...
                </div>
              </div>
            )}
          </>
        )}

        {err&&(
          <div style={{marginTop:12,padding:"10px 14px",background:"#1a0000",
            border:"1px solid #3a0000",borderRadius:8,fontSize:11,color:"#e85d2a",
            textAlign:"center",lineHeight:1.5}}>
            {err}
          </div>
        )}
      </div>

      <div style={{marginTop:28,fontSize:9,color:"#252525",letterSpacing:1.5,
        textAlign:"center",lineHeight:1.8,maxWidth:300}}>
        {stillValid
          ? <>ACCESS ACTIVE UNTIL {expDt.toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).toUpperCase()}</>
          : <>CONTACT ADMIN FOR ACCESS CODE · USE GYMLOG KEYGEN APP</>
        }
      </div>
    </div>
  );
}

export default LockScreen;
