export default abstract class NodeDestructor<T extends AudioNode> {
    public abstract worksOn(node:AudioNode):boolean;
    public abstract worksOn(node:T):true;

    public abstract destruct(node:T):void;
}

export class GeneralNodeDestructor extends NodeDestructor<AudioNode> {
    public worksOn(node: AudioNode): true {
        return true;
    }

    public destruct(node: AudioNode): void {
        node.disconnect();
    }
}

type StoppableAudioNode = AudioNode & { stop():void };
export class StoppableNodeDestructor extends NodeDestructor<StoppableAudioNode> {
    public worksOn(node: AudioNode): boolean;
    public worksOn(node: StoppableAudioNode): true;
    public worksOn(node: AudioNode & { stop?: unknown }): boolean {
        return "stop" in node;
    }
    public destruct(node: StoppableAudioNode): void {
        node.stop();
    }
}
