import React from "react";

// Components live at module scope so their identity is stable across renders —
// declared inside App they were new function objects each time, which made
// React unmount and remount the whole tree on every state change (losing rest
// timers, scroll position, focus and search text). Shared state travels by
// context instead of closure.
const AppCtx = React.createContext(null);
function useApp(){ return React.useContext(AppCtx); }

export { AppCtx, useApp };
