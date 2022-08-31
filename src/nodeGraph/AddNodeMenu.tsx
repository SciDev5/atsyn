import { css } from "@emotion/css";
import React, { useState } from "react";
import useKeybind, { Keybind } from "../util/useKeybind";
import useMouseScreenPos from "../util/useMouseScreenPos";
import { NodeClass, NodeContext } from "./Node";

export default function AddNodeMenu(props:{
    addNode:(NodeClass:NodeClass)=>void,
    context:NodeContext,
}) {
    const [shown,setShown] = useState(false);

    useKeybind(new Keybind("a").shift,()=>{
        setShown(true);
    });
    useKeybind(new Keybind("Escape"),()=>{
        setShown(false);
    });

    const pad = 10;
    const displayPos = useMouseScreenPos(!shown);

    if (!shown) return <></>;


    return (
        <div
            style={{
                top: displayPos.y-pad,
                left: displayPos.x-pad,
            }}
            className={css({
                position: "fixed",
                padding: pad,
                borderRadius: pad/2,
                border: "1px solid #ffffff40"
            })}
            onMouseLeave={e=>{
                if (e.currentTarget !== e.target) return;
                setShown(false);
            }}
        >
            <div className={css({
                background:"#202023",
                color: "#7777ff",
                width: "10em",
            })}>
                <div
                    className={css({
                        background:"#171719",
                        color: "#909090",
                        fontSize: ".8em",
                        padding: ".2em .4em",
                    })}
                >Add Node:</div>
                <div
                    className={css({
                        maxHeight: "20em",
                        overflowY: "auto",
                        overflowX: "clip",
                    })}
                >

                    {
                        props.context.currentlyCreatableNodes.map(v=>(
                            <div
                                key={v.name}
                                onClick={e=>{
                                    props.addNode(v);
                                    setShown(false);
                                }}
                                className={css({
                                    padding: ".2em .4em",
                                    "&:hover": {
                                        color: "#ffffff",
                                        background: "#303035",
                                    },
                                })}
                            >
                                {v.name}
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}