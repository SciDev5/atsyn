import { useEffect } from "react";

export default function useWindowEvent<Ev extends keyof WindowEventMap>(evName:Ev,handler:((e:WindowEventMap[Ev])=>void)|null) {
    useEffect(()=>{
        if (handler === null) return;
        addEventListener(evName,handler);
        return ()=>
            removeEventListener(evName,handler);
    },[evName,handler]);
}