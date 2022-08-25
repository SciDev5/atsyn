export type NChannels = 1|2|3|5;
export type ArrByChannels<T,N=NChannels> = N extends 1 ? [T] : N extends 2 ? [T,T] : N extends 3 ? [T,T,T] : [T,T,T,T,T];