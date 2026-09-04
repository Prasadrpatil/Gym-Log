import chestImg    from '../assets/muscles/chest.png';
import backImg     from '../assets/muscles/back.png';
import bicepsImg   from '../assets/muscles/biceps.png';
import tricepsImg  from '../assets/muscles/triceps.png';
import legsImg     from '../assets/muscles/legs.png';
import shouldersImg from '../assets/muscles/shoulders.png';
import absImg      from '../assets/muscles/abs.png';

import { getMuscleColor } from "../muscleColors";

// ── Muscle icons ────────────────────────────────────────────
// Images live at: gymlog-app/src/assets/muscles/
// chest.png | back.png | biceps.png | triceps.png
// legs.png  | shoulders.png | abs.png
const MUSCLE_IMGS = {
  Chest:     chestImg,
  Back:      backImg,
  Biceps:    bicepsImg,
  Triceps:   tricepsImg,
  Legs:      legsImg,
  Shoulders: shouldersImg,
  Abs:       absImg,
};

const MuscleIcon = ({ muscle, size = 48, showColor = false }) => {
  const src = MUSCLE_IMGS[muscle];
  const color = getMuscleColor(muscle||"");
  if (!src) {
    // fallback circle for unknown muscles
    return (
      <div style={{
        width:size, height:size, borderRadius:'50%', flexShrink:0,
        background: showColor ? color+"33" : "#1e1e1e",
        border: `2px solid ${showColor ? color : "#2a2a2a"}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: size*0.35, color: showColor ? color : "#484848"
      }}>?</div>
    );
  }
  return (
    <div style={{position:'relative', width:size, height:size, flexShrink:0}}>
      <img
        src={src}
        width={size}
        height={size}
        style={{objectFit:'contain', display:'block'}}
        alt={muscle}
      />
      {showColor && (
        <div style={{
          position:'absolute', bottom:0, left:'50%',
          transform:'translateX(-50%)',
          width:size*0.5, height:3, borderRadius:2,
          background:color, opacity:0.9
        }}/>
      )}
    </div>
  );
};

export default MuscleIcon;
