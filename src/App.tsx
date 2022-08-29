import React from "react";
import { useState } from "react";
import Node, { NodeContext } from "./nodeGraph/Node";
import NodesViewport from "./nodeGraph/NodesViewport";
import { PortSide } from "./nodeGraph/PortSide";
import Row from "./nodeGraph/Row";
import Vec from "./util/Vec";

const nodeContext = new NodeContext;
class ANode extends Node {
    readonly rowA = new ARow(Node.rowInitData<ANode>(this),new Set([PortSide.INPUT,PortSide.OUTPUT]));
    readonly HeaderComponent = ()=>{
        return (
            <>
                hello
            </>
        );
    };
}
class ARow extends Row<ANode> {
    readonly height = 30;
    readonly Component = ()=>{
        const [s,ss] = useState(0);
        return (
            <button onClick={e=>ss(Math.random())}>
                {s}
            </button>
        );
    };
}
const a = new ANode(nodeContext,new Vec(-235,-10));
const b = new ANode(nodeContext,new Vec(35,30));
Node.connect(a.rowA,b.rowA);

export default function App() {
    return (
        <NodesViewport width={700} height={500} {...{nodeContext}}/>
    );
}