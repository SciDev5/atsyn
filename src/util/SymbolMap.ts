class SymbolMap<T> {
    _:{[k:symbol]:T} = {};
    *[Symbol.iterator]() {
        for (const key of Reflect.ownKeys(this._) as symbol[])
            yield this._[key];
    }
}

export default SymbolMap;