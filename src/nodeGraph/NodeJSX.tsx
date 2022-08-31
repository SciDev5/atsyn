import { css } from "@emotion/css";
import React, { useEffect, useRef, useState } from "react";
import Vec from "../util/Vec";
import DragHandler, { Drag } from "./DragHandler";
import NodeGraphConsts from "./NodeGraphConsts";
import NodeShape from "./NodeShape";

export default function NodeJSX(props:{off:Vec,dragHandler:DragHandler,shape:NodeShape}) {
    const
        { shape } = props,
        { pos } = shape,
        borderWidth = 1.5,
        { x, y } = pos.plus(new Vec(-borderWidth,-borderWidth)).minus(props.off),
        wPad = 10,
        width = shape.width+2*borderWidth+wPad,
        height = shape.height+2*borderWidth;

    const [drag,setDrag] = useState<boolean>(false);

    const {Header} = shape.ref;

    const resizeRef = useRef() as React.RefObject<HTMLDivElement>;
    useEffect(()=>{
        const
            elt = resizeRef.current!,
            observer = new ResizeObserver(()=>{
                shape.ref.width = elt.offsetWidth-2*borderWidth;
            });

        observer.observe(elt);
        return ()=>{
            observer.unobserve(elt);
        };
    },[]);

    return (
        <foreignObject {...{x,y,width,height}}>
            <div
                style={{resize:"horizontal",overflowY:"auto",overflowX:"clip"}}
                ref={resizeRef}
                className={css({
                    backgroundColor: "#202024",
                    border: borderWidth+"px solid #777777",
                    boxSizing: "content-box",
                    color: "#ffffff",
                    height: shape.height,
                    minWidth: 100,
                    marginRight: wPad,
                })}
            >
                <div
                    className={css({
                        height:shape.hdrHeight,
                        lineHeight:shape.hdrHeight+"px",
                        backgroundColor: drag ? "#00ffff" : "#0000ff",
                        userSelect: "none",
                        paddingInline: ".5em",
                    })}
                    onMouseDown={e=>{
                        if (e.altKey) return;
                        const posOff = shape.pos.minus(props.dragHandler.pos);
                        setDrag(true);
                        new Drag(
                            props.dragHandler,
                            modifiers=>{
                                return modifiers.mouse0;
                            },
                            (pos,_,modifiers)=>{
                                const newPos = posOff.plus(pos);
                                shape.ref.pos = modifiers.ctrl ?
                                    newPos.roundSnap(50) :
                                    newPos;
                            },
                            pos=>{
                                setDrag(false);
                            },
                        );
                    }}
                >
                    {typeof Header === "string" ?
                        Header :
                        <Header />
                    }
                </div>
                {shape.rows.map((row,i)=>{
                    const Row = row.Component;
                    return (
                        <div key={i} className={css({
                            height: row.height,
                            paddingBlock: NodeGraphConsts.rowPaddingBlock,
                        })+" "+css(
                            {
                                marginInline: 7,
                                borderTop: NodeGraphConsts.rowBorderTop+"px solid #777777",
                                boxSizing: "content-box",
                            },
                        )}>
                            <Row />
                        </div>
                    );
                })}
            </div>
        </foreignObject>
    );
}