import { uid } from "./id";

const STORAGE_KEY = "gymlog/v5/data";

// ── Exercise data ─────────────────────────────────────────────
// Ids are namespaced by muscle: the same exercise name is seeded under two
// groups (Romanian Deadlift, Stiff Leg Deadlift, Close Grip Bench Press),
// and an unqualified id collides across them.
function makeExercises(mId,names){ return names.map(n=>({id:`e_${mId}_${n.replace(/\s+/g,"_").toLowerCase()}`,name:n,sessions:[]})); }

const DEFAULT_MUSCLES=[
  {id:"m1",name:"Chest", exercises:makeExercises("m1",[
    "Barbell Bench Press","Incline Barbell Bench Press","Decline Barbell Bench Press",
    "Reverse Grip Bench Press","Close Grip Bench Press",
    "Dumbbell Bench Press","Incline Dumbbell Press","Decline Dumbbell Press",
    "Dumbbell Fly","Incline Dumbbell Fly","Decline Dumbbell Fly","Dumbbell Pullover",
    "Smith Machine Bench Press","Smith Machine Incline Press","Smith Machine Decline Press",
    "Cable Fly (High to Low)","Cable Fly (Low to High)","Cable Fly (Mid)",
    "Pec Deck Machine","Chest Press Machine","Plate Loaded Chest Press",
    "Push-ups","Wide Push-ups","Decline Push-ups","Weighted Push-ups","Chest Dips",
  ])},
  {id:"m2",name:"Back", exercises:makeExercises("m2",[
    "Deadlift","Romanian Deadlift","Stiff Leg Deadlift","Barbell Row","Pendlay Row",
    "Rack Pull","Meadows Row",
    "Single Arm Dumbbell Row","Dumbbell Row","Incline Bench Dumbbell Row",
    "Smith Machine Row",
    "Lat Pulldown","Wide Grip Pulldown","Close Grip Pulldown","Reverse Grip Pulldown",
    "Seated Cable Row","Straight Arm Pulldown","Face Pull",
    "Pull-ups","Weighted Pull-ups","Chin-ups","Inverted Rows",
  ])},
  {id:"m3",name:"Shoulders", exercises:makeExercises("m3",[
    "Barbell Overhead Press","Seated Barbell Press","Push Press","Behind the Neck Press","Upright Row",
    "Dumbbell Shoulder Press","Arnold Press","Dumbbell Lateral Raise","Dumbbell Front Raise",
    "Rear Delt Fly","Dumbbell Shrugs",
    "Smith Machine Shoulder Press","Smith Machine Upright Row","Smith Machine Shrugs",
    "Cable Lateral Raise","Cable Front Raise","Cable Rear Delt Fly",
    "Machine Shoulder Press","Machine Lateral Raise","Reverse Pec Deck",
  ])},
  {id:"m4",name:"Biceps", exercises:makeExercises("m4",[
    "Barbell Curl","EZ Bar Curl","Reverse Curl",
    "Alternating Dumbbell Curl","Hammer Curl","Incline Dumbbell Curl",
    "Concentration Curl","Zottman Curl",
    "Cable Curl","Rope Cable Curl","Preacher Curl Machine","Cable Single Arm Curl",
  ])},
  {id:"m5",name:"Triceps", exercises:makeExercises("m5",[
    "Close Grip Bench Press","Skull Crushers","JM Press",
    "Overhead Dumbbell Extension","Seated Overhead Extension","Dumbbell Skull Crushers","Tricep Kickbacks",
    "Cable Pushdown","Rope Pushdown","Reverse Grip Pushdown","Cable Overhead Extension","Single Arm Pushdown",
    "Bench Dips","Parallel Bar Dips","Weighted Dips",
  ])},
  {id:"m6",name:"Legs", exercises:makeExercises("m6",[
    "Barbell Squat","Front Squat","Romanian Deadlift","Stiff Leg Deadlift","Good Mornings","Barbell Hip Thrust",
    "Dumbbell Squat","Goblet Squat","Walking Lunges","Reverse Lunges","Bulgarian Split Squat","Step Ups",
    "Smith Machine Squat","Smith Machine Lunges","Smith Machine Hip Thrust",
    "Leg Press","Hack Squat","Leg Extension","Leg Curl (Lying)","Leg Curl (Seated)",
    "Standing Calf Raise","Seated Calf Raise","Leg Press Calf Raise","Donkey Calf Raise",
  ])},
  {id:"m7",name:"Abs", exercises:makeExercises("m7",[
    "Crunches","Weighted Crunch","Cable Crunch","Decline Sit-ups",
    "Hanging Leg Raise","Hanging Knee Raise","Reverse Crunch",
    "Russian Twist","Weighted Russian Twist",
    "Plank","Side Plank","Ab Wheel Rollout","V-Ups","Toe Touches","Mountain Climbers",
  ])},
].map(m=>({...m,lastEdited:Date.now(),exercises:m.exercises.map(e=>({...e,sessions:[]}))}));

// Sessions with no sets are hidden everywhere (see getAllSessions) but still
// persist. One is created up-front by the wizard, so killing the app mid-log
// leaks one each time. Drop them on load, when no wizard can be in flight.
function purgeEmptySessions(d){
  return {...d, users:d.users.map(u=>({...u, muscles:(u.muscles||[]).map(m=>({...m,
    exercises:m.exercises.map(e=>({...e, sessions:e.sessions.filter(s=>s.sets?.length)}))
  }))}))};
}

function initData(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw){ const d=JSON.parse(raw); if(d?.users?.length) return purgeEmptySessions(d); }
  }catch{}
  const u=makeDefaultUser("Me");
  return {users:[u],activeUserId:u.id};
}

// ── Default first user ───────────────────────────────────────
function makeDefaultUser(name="Me"){
  return { id: uid(), name, muscles: DEFAULT_MUSCLES.map(m=>({...m,exercises:m.exercises.map(e=>({...e,sessions:[]})) })) };
}

function getAllSessions(muscles){
  const out=[];
  muscles.forEach(m=>m.exercises.forEach(e=>e.sessions.forEach(s=>{
    if(!s.sets||s.sets.length===0) return; // skip empty sessions
    out.push({...s,mId:m.id,mName:m.name,eName:e.name,eId:e.id});
  })));
  return out.sort((a,b)=>{
    const dateDiff=new Date(b.date)-new Date(a.date);
    if(dateDiff!==0) return dateDiff;
    // same date — sort by dayOrder if set
    return (a.dayOrder??999)-(b.dayOrder??999);
  });
}
function groupByDay(sessions){
  const map={};
  sessions.forEach(s=>{ if(!map[s.date]) map[s.date]=[]; map[s.date].push(s); });
  return Object.keys(map).sort((a,b)=>new Date(b)-new Date(a)).map(date=>({date,sessions:map[date]}));
}

export { STORAGE_KEY, makeExercises, DEFAULT_MUSCLES, purgeEmptySessions, initData, makeDefaultUser, getAllSessions, groupByDay };
