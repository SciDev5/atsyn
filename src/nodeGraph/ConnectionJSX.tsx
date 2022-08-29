import { css, CSSInterpolation } from "@emotion/css";
import React, { useEffect, useState } from "react";
import Vec from "../util/Vec";
import { ConnectionShape } from "./ConnectionShape";

export default function ConnectionJSX(props:{off:Vec,shape:ConnectionShape}) {
    const {
            from: {pos:from_},
            to: {pos:to_},
            ref,
        } = props.shape,
        from = from_.minus(props.off),
        to = to_.minus(props.off);
    const l = 25;
    const path = `
    M ${from.x} ${from.y}
    h ${l}
    L ${to.x-l} ${to.y}
    h${l}`;

    const [clicked,setClicked] = useState(false);
    const [hover,setHover] = useState(false);
    const [mouseDown,setMouseDown] = useState(false);
    
    useEffect(()=>{
        if (!clicked) return;
        const ev = (e:KeyboardEvent)=>{            
            if (e.key === "Backspace" || e.key === "Delete")
                ref.disconnect();
        };
        addEventListener("keydown",ev);
        return ()=>{
            removeEventListener("keydown",ev);
        };
    },[clicked,ref]);

    const commonCss:CSSInterpolation = {
        fill: "none",
        strokeLinejoin: "bevel",
        strokeLinecap: "round",
    };

    return (
        <>
            <path d={path}
                className={css(commonCss,{
                    stroke: hover ?
                        (mouseDown ? "#ff44ff" : "#0088ff") :
                        (clicked ? "#0088ff" : "#0044ff"),
                    strokeWidth: hover ? 
                        (mouseDown ? 7 : 4) :
                        2,
                })}
            />
            {clicked && (
                <path d={path}
                    className={css(commonCss,{
                        stroke: "#ff44ff99",
                        fill:"none",
                        strokeWidth:6,
                    })}
                />
            )}
            <path d={path}
                className={css(commonCss,{
                    stroke: "#ffffff11",
                    fill:"none",
                    strokeWidth:10,
                })}
                onMouseDown={e=>{
                    setMouseDown(true);
                }}
                onMouseOut={e=>{
                    setMouseDown(false);
                    setHover(false);
                }}
                onMouseOver={e=>{
                    setHover(true);
                }}
                onClick={e=>{                    
                    if (!clicked)
                        setTimeout(()=>
                            addEventListener("click",e=>{
                                setClicked(false);
                            },{once:true})
                        );
                    setClicked(true);
                    setMouseDown(false);
                }}
            />
        </>
    );
}