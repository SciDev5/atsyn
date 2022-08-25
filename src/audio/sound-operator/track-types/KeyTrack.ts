import { TrackBundle, TrackFiber } from "../Track";

type KeyTrack = TrackBundle<TrackBundle<{
        held: TrackFiber,
        frequency: TrackFiber,
    }>[]>;
export default KeyTrack;
