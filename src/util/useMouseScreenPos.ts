import { useState } from "react";
import useWindowEvent from "./useWindowEvent";
import Vec from "./Vec";

export default function useMouseScreenPos(update=true):Vec {
    const [pos,setPos] = useState(new Vec(0,0));
    useWindowEvent("mousemove", update ? e=>{
        setPos(new Vec(e.clientX,e.clientY));
    } : null);
    return pos;
}