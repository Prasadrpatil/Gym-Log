const MUSCLE_COLORS={
  chest:"#e85d2a",back:"#2a7de8",legs:"#e8a22a",shoulders:"#9b2ae8",
  arms:"#2ae8a2",core:"#e82a6a",glutes:"#e8d42a",calves:"#2ae8d4",
  default:"#5a5a5a"
};

function getMuscleColor(name=""){
  const n=name.toLowerCase();
  if(n.includes("chest")||n.includes("pec")) return MUSCLE_COLORS.chest;
  if(n.includes("back")||n.includes("lat")||n.includes("trap")) return MUSCLE_COLORS.back;
  if(n.includes("leg")||n.includes("quad")||n.includes("hamstr")||n.includes("calf")||n.includes("calves")) return MUSCLE_COLORS.legs;
  if(n.includes("shoulder")||n.includes("delt")) return MUSCLE_COLORS.shoulders;
  if(n.includes("arm")||n.includes("bicep")||n.includes("tricep")||n.includes("forearm")) return MUSCLE_COLORS.arms;
  if(n.includes("core")||n.includes("ab")||n.includes("oblique")) return MUSCLE_COLORS.core;
  if(n.includes("glute")||n.includes("hip")) return MUSCLE_COLORS.glutes;
  return MUSCLE_COLORS.default;
}

export { MUSCLE_COLORS, getMuscleColor };
