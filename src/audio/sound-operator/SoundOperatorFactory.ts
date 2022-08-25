import SoundOperator, { SoundOpIOData } from "./SoundOperator";


export default abstract class SoundOperatorFactory<T extends SoundOperator<SoundOpIOData, SoundOpIOData>> {
    abstract construct():T; 
}
