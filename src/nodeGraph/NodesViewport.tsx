import React, { useEffect, useRef, useState } from "react";
import ConnectionJSX from "./ConnectionJSX";
import { ConnectionShape } from "./ConnectionShape";
import Node, { NodeContext } from "./Node";
import NodeJSX from "./NodeJSX";
import NodeShape from "./NodeShape";
import { NodeUpdateEv } from "./NodeUpdateEv";
import PortShape from "./PortShape";
import PortJSX from "./PortJSX";
import { Connection } from "./Connection";
import { css } from "@emotion/css";
import { PortEitherSide } from "./Port";
import { PortSide } from "./PortSide";
import DragHandler, { Drag } from "./DragHandler";
import NodeGraphConsts from "./NodeGraphConsts";
import AddNodeMenu from "./AddNodeMenu";
import { Arr, MathX, Vec } from "@scidev5/util-h";

function BackgroundGrid(props:{pan:Vec,scale:number}) {
    const scale = 10**MathX.floorMod(Math.log10(props.scale),1);
    const { pan } = props, gridSize = NodeGraphConsts.gridSize/scale, lineWidth = 2;

    const [size,setSize] = useState(new Vec(0,0));
    const resizeRef = useRef() as React.RefObject<HTMLDivElement>;
    useEffect(()=>{
        const elt = resizeRef.current;
        if (!elt) return;
        const observer = new ResizeObserver(()=>{
            setSize(new Vec(elt.offsetWidth,elt.offsetHeight));
        });
        observer.observe(elt);
        return ()=>{
            observer.unobserve(elt);
        };
    },[resizeRef.current]);

    const
        xOff = ((-pan.x/props.scale-size.x/2)%(gridSize*10)+gridSize*10)%(gridSize*10),
        yOff = ((-pan.y/props.scale-size.y/2)%(gridSize*10)+gridSize*10)%(gridSize*10),
        opacityK = ((scale-1)/9)**.5;

    return (
        <div ref={resizeRef} className={css({

            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        })}>
            <div  className={css({
                position: "absolute",
                top: -yOff,
                bottom: 0,
                left: -xOff,
                right: 0,
                opacity: 0.05 * (1-opacityK),
                background: `
            repeating-linear-gradient(          transparent, transparent ${gridSize-lineWidth}px, white ${gridSize-lineWidth}px, white ${gridSize}px),
            repeating-linear-gradient(0.25turn, transparent, transparent ${gridSize-lineWidth}px, white ${gridSize-lineWidth}px, white ${gridSize}px)
            `,
                backgroundOrigin: "content-box",
            })}/>
            <div  className={css({
                position: "absolute",
                top: -yOff,
                bottom: 0,
                left: -xOff,
                right: 0,
                opacity: 0.05 * opacityK,
                background: `
            repeating-linear-gradient(          transparent, transparent ${10*gridSize-lineWidth}px, white ${10*gridSize-lineWidth}px, white ${10*gridSize}px),
            repeating-linear-gradient(0.25turn, transparent, transparent ${10*gridSize-lineWidth}px, white ${10*gridSize-lineWidth}px, white ${10*gridSize}px)
            `,
                backgroundOrigin: "content-box",
            })}/>
        </div>
    );
}


export default class NodesViewport extends React.Component<{
    nodeContext:NodeContext,
    width:number|string,
    height:number|string,
    lockConnections?:boolean,
},{
    connections:ConnectionShape[],
    nodes:NodeShape[],
    ports:PortShape[],
    svgDim:Vec,
    svgOff:Vec,
    pan:Vec,
    scale:number,
    makingConnection?:{from:PortShape,toPos:Vec},
}> {
    private readonly dragContainerRef = React.createRef<HTMLDivElement>();
    private readonly dragHandler = new DragHandler();

    private readonly nodeContext:NodeContext;
    constructor(props:NodesViewport["props"]) {
        super(props);
        this.nodeContext = props.nodeContext;
        this.recalculateMaxDim();
        this.state = {
            ...this.connStates,
            ...this.nodeStates,
            ...this.svgDimStates,
            pan: new Vec(0,0),
            scale: 1,
        };
    }
    maxDim:Vec = new Vec(0,0);
    minDim:Vec = new Vec(0,0);
    private recalculateMaxDim() {
        const nodes = [...this.nodeContext.nodes], firstNodeShape = nodes[0]?.shape._;
        this.maxDim = firstNodeShape?.maxPos ?? new Vec(0,0);
        this.minDim = firstNodeShape?.pos ?? new Vec(0,0);
        this.updateMaxDim(nodes);
    }
    private updateMaxDim(updatedNodes:Node[]) {
        const {step,margin} = NodeGraphConsts.svgBorder;
        let max = this.maxDim, min = this.minDim;
        for (const {shape:{_:shape}} of updatedNodes) {
            max = new Vec(
                Math.max(max.x,Math.ceil(shape.maxPos.x/step)*step+margin),
                Math.max(max.y,Math.ceil(shape.maxPos.y/step)*step+margin),
            );
            min = new Vec(
                Math.min(min.x,Math.floor(shape.pos.x/step)*step-margin),
                Math.min(min.y,Math.floor(shape.pos.y/step)*step-margin),
            );
        }
        this.maxDim = max;
        this.minDim = min;
    }
    private get svgDimStates() {
        return {
            svgDim: this.maxDim.minus(this.minDim),
            svgOff: this.minDim,
        };
    }
    componentDidMount() {
        this.nodeContext.ev.on(NodeUpdateEv.node,this.onChangeNode);
        this.nodeContext.ev.on(NodeUpdateEv.conn,this.onChangeConn);
        this.dragHandler.watch(this.dragContainerRef.current!);
        this.dragHandler.pan = this.state.pan;
        this.dragHandler.scale = this.state.scale;
    }
    componentWillUnmount() {
        this.nodeContext.ev.off(NodeUpdateEv.node,this.onChangeNode);
        this.nodeContext.ev.off(NodeUpdateEv.conn,this.onChangeConn);
        this.dragHandler.unwatch();
    }
    private get nodeStates() {
        const nodes = [...this.nodeContext.nodes];
        return {
            nodes: nodes.map(v=>v.shape._),
            ports: nodes.flatMap(v=>v.allPorts).map(v=>v.shape._),
        };
    }
    private get connStates() {
        return {
            connections:[...this.nodeContext.connections].map(v=>v.shape._),
        };
    }
    private readonly onChangeNode = (node:Node)=>{
        this.recalculateMaxDim();
        this.setState({
            ...this.nodeStates,
            ...this.svgDimStates,
        });
    };
    private readonly onChangeConn = (conn:Connection)=>{
        this.setState({
            ...this.connStates,
        });
    };

    private readonly possibleConnectionTargets = new Set<PortEitherSide>;
    private get bestConnectionTarget() {
        if (!this.state.makingConnection) return;
        const pos = this.state.makingConnection.toPos;
        return [...this.possibleConnectionTargets].map(v=>({v,dist:v.shape._.pos.minus(pos).lenSq})).sort((a,b)=>a.dist-b.dist)[0]?.v;
    }

    render(): React.ReactNode {
        const
            {
                width,
                height,
            } = this.props,
            {
                svgDim,
                svgOff,
                nodes,
                connections,
                ports,
                pan,
                scale,
            } = this.state;
        return (
            <div
                className={css({
                    width,
                    height,
                    position: "relative",
                    overflow:"clip",
                    background: "#101010",
                })}

                onMouseDown={e=>{
                    switch(e.button) {
                    case 0:
                        if (!e.altKey) return;
                        break;
                    case 2: break;
                    default: return;
                    }
                    let newPan = pan;
                    new Drag(
                        this.dragHandler,
                        modifiers=>{
                            return (
                                (modifiers.alt && modifiers.mouse0) ||
                                (modifiers.mouse2)
                            );
                        },
                        (_,deltaPos)=>{
                            newPan = newPan.plus(deltaPos);
                            this.setState({pan:newPan});
                            this.dragHandler.pan = newPan;
                        },()=>{
                            // do nothing
                        }
                    );
                }}
                onWheel={e=>{
                    const newScale = Math.min(10,Math.max(0.5,scale*2**(NodeGraphConsts.scrollSpeed*e.deltaY)));
                    this.setState({scale:newScale});
                    this.dragHandler.scale = newScale;
                }}
                ref={this.dragContainerRef}
            >
                <BackgroundGrid {...{pan,scale}} />
                <div
                    className={css({
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                    })}
                >
                    <svg
                        style={{
                            transformOrigin: "top left",
                            transform:`
                                scale(${1/scale})
                                translate(${pan.x}px, ${pan.y}px)
                                translate(${svgOff.x}px, ${svgOff.y}px)
                            `,
                        }}
                        width={svgDim.x}
                        height={svgDim.y}
                    >
                        {nodes.map(v=>(
                            <NodeJSX key={v.ref.strId}
                                off={svgOff} dragHandler={this.dragHandler}
                                shape={v}
                            />
                        ))}
                        {connections.map(v=>(
                            <ConnectionJSX key={v.ref.strId}
                                locked={this.props.lockConnections ?? false}
                                off={svgOff}
                                shape={v}
                            />
                        ))}
                        {this.state.makingConnection && !this.props.lockConnections && (
                            <ConnectionJSX
                                off={svgOff}
                                preview
                                points={Arr.conditionalReverse(
                                    [
                                        this.state.makingConnection.from.pos,
                                        this.bestConnectionTarget?.shape._.pos ?? this.state.makingConnection.toPos,
                                    ],
                                    this.state.makingConnection.from.ref.side === PortSide.INPUT,
                                )}
                                connectionPossible={
                                    !!this.bestConnectionTarget
                                }
                            />
                        )}
                        {ports.map(v=>(
                            <PortJSX key={v.ref.strId}
                                off={svgOff} dragHandler={this.dragHandler}
                                shape={v}
                                previewConnection={(from,toPos)=>{
                                    this.setState({makingConnection:{from,toPos}});
                                }}
                                tryMakeConnection={()=>{
                                    this.setState({makingConnection:undefined});

                                    if (this.props.lockConnections) return;

                                    const {makingConnection} = this.state, {bestConnectionTarget} = this;
                                    if (makingConnection && bestConnectionTarget !== undefined) {
                                        const from = makingConnection.from.ref as PortEitherSide, to = bestConnectionTarget;
                                        if (from.side === PortSide.OUTPUT && to.side === PortSide.INPUT)
                                            from.connect(to);
                                        if (from.side === PortSide.INPUT && to.side === PortSide.OUTPUT)
                                            to.connect(from);
                                    }
                                }}
                                setAllowConnection={(port,allowed)=>{
                                    this.possibleConnectionTargets[allowed ? "add" : "delete"](port);
                                }}
                                makingConnectionFrom={this.props.lockConnections ? undefined : this.state.makingConnection?.from}
                            />
                        ))}
                    </svg>
                </div>
                <AddNodeMenu
                    addNode={NodeClass=>{
                        new NodeClass(this.props.nodeContext,this.dragHandler.pos);

                    }}
                    context={this.props.nodeContext}
                />
            </div>
        );
    }
}