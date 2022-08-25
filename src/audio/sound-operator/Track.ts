
/**
 * Common functions and data for data tracks.
 */
export default class Track {
    // TODO implement
}

/**
 * A Track representing a single stream of data
 */
export class TrackFiber extends Track {
    readonly t = "FIBER";
    // TODO implement

}
/**
 * A Track representing an ordered collection of TrackFibers.
 */
export class TrackBundle<K extends {[k: string]: SomeTrackFiberOrBundle}|SomeTrackFiberOrBundle[]> extends Track {
    readonly t = "BUNDLE";
    // TODO, implement
    _:K = null!;
}


export type SomeTrackFiberOrBundle = TrackFiber|TrackBundle<{[k:string]:SomeTrackFiberOrBundle}|SomeTrackFiberOrBundle[]>; 