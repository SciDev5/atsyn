import { css } from "@emotion/css";
import React, { useEffect, useState } from "react";
import Vec from "../util/Vec";
import DragHandler, { Drag } from "./DragHandler";
import { PortEitherSide } from "./Port";
import PortShape from "./PortShape";

export default function PortJSX(props:{
    off:Vec,
    dragHandler:DragHandler,
    shape:PortShape,
    makingConnectionFrom?:PortShape,
    previewConnection:(from:PortShape,to:Vec)=>void,
    setAllowConnection:(port:PortEitherSide,allowed:boolean)=>void,
    tryMakeConnection:()=>void,
}) {
    const { shape, off } = props, {x,y} = shape.pos.minus(off);
    const [hover,setHover] = useState(false);
    const [allowingConnection,setAllowingConnection] = useState(false);

    useEffect(()=>{
        const allow =
            hover &&
            props.makingConnectionFrom !== undefined &&
            ![...props.makingConnectionFrom.ref.connections].some(v=> v.from === shape.ref || v.to === shape.ref) &&
            props.makingConnectionFrom.ref.side !== shape.ref.side;
        props.setAllowConnection(
            shape.ref,
            allow,
        );
        setAllowingConnection(allow);
    },[ props.makingConnectionFrom, hover ]);

    return (<>
        <circle cx={x} cy={y} r={PortShape.radius} className={css(
            {
                strokeWidth: 2,
            },
            hover ? {
                fill:"#00ffff",
                stroke: "#7799ff",
            } : {
                fill:"#0000ff",
                stroke: "#777777",
            },
        )} />
        <circle cx={x} cy={y} r={PortShape.radius*(props.makingConnectionFrom ? 4 : 2)} className={css(
            allowingConnection ? {
                fill:"#00ffff44",
                stroke: "#00ffff",
            } : {
                fill: "#ffffff01",
                stroke: "none",
                "&:hover": {
                    fill: "#ffffff20",
                },
            }
        )}
        onMouseDown={e=>{
            if (e.altKey) return;
            new Drag(
                props.dragHandler,
                modifiers=>{
                    return modifiers.mouse0;
                },
                pos=>{
                    props.previewConnection(shape,pos);
                },
                pos=>{
                    props.tryMakeConnection();
                }
            );
        }}
        onMouseEnter={e=>{
            setHover(true);
        }}
        onMouseLeave={e=>{
            setHover(false);
        }}
        />
    </>);
}