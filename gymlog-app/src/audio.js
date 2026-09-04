// ── Rest-timer chime ─────────────────────────────────────────
// One shared AudioContext, primed from a real tap. A context built outside a
// user gesture starts suspended in the Android WebView and never sounds, and
// building a fresh one per ring eventually hits the per-page limit.
let audioCtx = null;
function primeAudio(){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==="suspended") audioCtx.resume();
  }catch{}
}
function playRing(){
  try{
    primeAudio();
    if(!audioCtx) return;
    const t0=audioCtx.currentTime;
    [[880,0,0.15],[1100,0.18,0.12],[880,0.35,0.2]].forEach(([freq,delay,dur])=>{
      const osc=audioCtx.createOscillator();
      const gain=audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.type="sine"; osc.frequency.value=freq;
      gain.gain.setValueAtTime(0,t0+delay);
      gain.gain.linearRampToValueAtTime(0.4,t0+delay+0.02);
      gain.gain.exponentialRampToValueAtTime(0.001,t0+delay+dur);
      osc.start(t0+delay);
      osc.stop(t0+delay+dur+0.05);
    });
  }catch{}
}

export { primeAudio, playRing };
