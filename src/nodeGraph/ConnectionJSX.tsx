import { css, CSSInterpolation } from "@emotion/css";
import React, { useEffect, useState } from "react";
import Vec from "../util/Vec";
import { ConnectionShape } from "./ConnectionShape";

export default function ConnectionJSX(props:{off:Vec}&({preview?:false,shape:ConnectionShape,locked:boolean}|{preview:true,points:[Vec,Vec],connectionPossible:boolean})) {
    const
        {from_,to_} = (props.preview ? {
            from_: props.points[0],
            to_: props.points[1],
        } : {
            from_: props.shape.from .pos,
            to_:   props.shape.to   .pos
        }),
        ref = props.preview ? null : props.shape.ref,
        locked = props.preview ? false : props.locked,
        connectionPossible = props.preview ? props.connectionPossible : false,
        from = from_.minus(props.off),
        to = to_.minus(props.off);
    const l = Math.sign(to.x-from.x) * Math.min(25, from.minus(to).len/4, Math.abs(to.x-from.x)/4);
    const path = `
    M ${from.x} ${from.y}
    h ${l}
    L ${to.x-l} ${to.y}
    h${l}`;

    const [clicked,setClicked] = useState(false);
    const [hover,setHover] = useState(false);
    const [mouseDown,setMouseDown] = useState(false);

    useEffect(()=>{
        if (!clicked || !ref || locked) return;
        const ev = (e:KeyboardEvent)=>{
            if (e.key === "Backspace" || e.key === "Delete")
                ref.disconnect();
        };
        addEventListener("keydown",ev);
        return ()=>{
            removeEventListener("keydown",ev);
        };
    },[clicked,ref,locked]);

    const commonCss:CSSInterpolation = {
        fill: "none",
        strokeLinejoin: "bevel",
        strokeLinecap: "round",
    };

    if (ref)
        return (
            <>
                <path d={path}
                    className={css(commonCss,{
                        stroke: hover ?
                            (mouseDown ? "#ff44ff" : "#0088ff") :
                            (clicked ? "#0088ff" : "#0044ff"),
                        boxShadow: "1 1 #000000",
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
    else
        return (
            <path d={path}
                className={css({
                    fill:"none",
                    stroke: "#7777ff",
                    strokeWidth: connectionPossible ? 3 : 2,
                    strokeDasharray: connectionPossible ? "5 0" : "5 5",
                })}
            />
        );
}