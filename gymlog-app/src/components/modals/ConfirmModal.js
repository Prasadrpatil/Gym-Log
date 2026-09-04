import { useApp } from "../../context";
import { mTtl, rw, btn } from "../../theme";
import Wrap from "../Wrap";

function ConfirmModal({msg,onOk}){
  const {setModal} = useApp();
  return <Wrap>
    <div style={{...mTtl,marginBottom:10}}>Confirm Delete</div>
    <div style={{color:"#555",fontSize:13,marginBottom:22,lineHeight:1.7}}>{msg}</div>
    <div style={rw}>
      <button style={btn()} onMouseDown={e=>{e.stopPropagation();setModal(null);}}>Cancel</button>
      <button style={btn(false,true)} onMouseDown={e=>{e.stopPropagation();onOk();setModal(null);}}>Delete</button>
    </div>
  </Wrap>;
}

export default ConfirmModal;
