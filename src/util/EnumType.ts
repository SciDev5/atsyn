type EnumType<T> = Extract<T[keyof T],symbol>;
export default EnumType;