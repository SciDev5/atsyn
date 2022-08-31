import React from "react";
import NodesViewport from "./nodeGraph/NodesViewport";
import AudioGraphNodeContext from "./audioNodeGraph/AudioGraphNodeContext";

const nctx = new AudioGraphNodeContext;

export default function App() {
    const agcPlaying = nctx.playingV.useState();
    return (
        <>
            <div>
                {
                    agcPlaying ? (
                        <button onClick={async e=>{
                            nctx.stop();
                        }}>stop</button>
                    ) : (
                        <button onClick={async e=>{
                            const actx = new AudioContext;
                            nctx.start(actx);

                        }}>start</button>
                    )
                }
            </div>
            <NodesViewport width={window.innerWidth-50} height={window.innerHeight-50} {...{nodeContext: nctx}} lockConnections={agcPlaying}/>
        </>
    );
}