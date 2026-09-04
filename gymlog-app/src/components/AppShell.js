import { useApp } from "../context";
import { C, T } from "../theme";
import Sidebar from "./Sidebar";
import AnatomyModal from "./AnatomyModal";
import BodyWeightModal from "./BodyWeightModal";
import StepsGraphModal from "./StepsGraphModal";
import CalendarOverlay from "./CalendarOverlay";
import Wizard from "./Wizard";
import ExerciseDetail from "./ExerciseDetail";
import ExerciseHistory from "./ExerciseHistory";
import DayDetail from "./DayDetail";
import Home from "./Home";
import NameModal from "./modals/NameModal";
import EditExModal from "./modals/EditExModal";
import SetModal from "./modals/SetModal";
import EditSetModal from "./modals/EditSetModal";
import ConfirmModal from "./modals/ConfirmModal";
import DayWeightModal from "./modals/DayWeightModal";
import DayStepsModal from "./modals/DayStepsModal";
import BackupModal from "./modals/BackupModal";

function AppShell(){
  const {sidebar,anatomyOpen,bwOpen,setBwOpen,stepsOpen,setStepsOpen,calOpen,
         wizard,screen,modal,addMuscle,addUser,addEx,getMuscle} = useApp();
  return(
  <div style={{height:"100vh",background:C.bg,color:C.text,...T,fontSize:14,overflow:"hidden",display:"flex",flexDirection:"column"}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
      input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.4);cursor:pointer;}
      input[type=number]{-moz-appearance:textfield;}
      input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
      ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:#0a0a0a;}
      ::-webkit-scrollbar-thumb{background:#181818;border-radius:2px;}
      input:focus{border-color:#2a4200!important;}
      button:active{opacity:0.75;}
    `}</style>

    {sidebar&&<Sidebar/>}
    {anatomyOpen&&<AnatomyModal/>}
    {bwOpen&&<BodyWeightModal onClose={()=>setBwOpen(false)}/>}
    {stepsOpen&&<StepsGraphModal onClose={()=>setStepsOpen(false)}/>}
    {calOpen&&<CalendarOverlay/>}

    <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      {wizard
        ? <Wizard/>
        : screen==="exercise"
          ? <ExerciseDetail/>
          : screen==="exHistory"
            ? <ExerciseHistory/>
            : screen==="day"
              ? <DayDetail/>
              : <Home/>
      }
    </div>

    {modal?.type==="addMuscle"&&<NameModal title="Add Muscle Group" ph="e.g. Glutes, Forearms…" onAdd={addMuscle}/>}
    {modal?.type==="addUser"   &&<NameModal title="Add User" ph="e.g. Alex, Sarah…" onAdd={addUser}/>}
    {modal?.type==="addEx"    &&<NameModal title="Add Exercise" ph="e.g. Bench Press, Squat…" onAdd={n=>addEx(modal.mId,n)} checkDupe={n=>getMuscle(modal.mId)?.exercises.some(e=>e.name.trim().toLowerCase()===n.trim().toLowerCase())}/>}
    {modal?.type==="editEx"   &&<EditExModal mId={modal.mId} eId={modal.eId} current={modal.current}/>}
    {modal?.type==="addSet"   &&<SetModal mId={modal.mId} eId={modal.eId} sid={modal.sid}/>}
    {modal?.type==="editSet"  &&<EditSetModal mId={modal.mId} eId={modal.eId} sid={modal.sid} set={modal.set}/>}
    {modal?.type==="confirm"  &&<ConfirmModal msg={modal.msg} onOk={modal.onOk}/>}
    {modal?.type==="dayWeight" &&<DayWeightModal date={modal.date}/>}
    {modal?.type==="daySteps"  &&<DayStepsModal  date={modal.date}/>}
    {modal?.type==="backup"    &&<BackupModal/>}
  </div>
  );
}

export default AppShell;
