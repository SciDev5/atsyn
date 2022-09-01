import { css } from "@emotion/css";
import { ValueSource, ValueTarget } from "@scidev5/util-h";
import React from "react";
import Styles from "../../../css/Styles";
import Node, { RowInitData } from "../../../nodeGraph/Node";
import Row from "../../../nodeGraph/Row";

export default class SelectRow<O extends { [key: string]: string; }> extends Row {
    private readonly options: O;
    constructor(
        rowInitData: RowInitData<Node>,
        options: O,
        defaultValue: keyof O
    ) {
        super(rowInitData, []);
        this.options = Object.fromEntries(Object.entries(options)) as O;
        this.valueSource = new ValueSource(defaultValue);
        this.valueTarget = this.valueSource.target;
    }

    private readonly valueSource:ValueSource<keyof O>;
    readonly valueTarget:ValueTarget<keyof O>;
    get value() { return this.valueTarget.value }
    set value(value) { this.valueSource.assign(value) }

    readonly height = 30;
    readonly Component = () => {
        const value = this.valueTarget.useState();
        return (
            <select
                value={value as string}
                onChange={e => {
                    this.value = e.currentTarget.value as keyof O;
                }}
                className={css(
                    Styles.input(),
                    {
                        display: "block",
                        width: "100%",
                        height: this.height,
                        "> option": {
                            background: "inherit",
                        },
                    }
                )}
            >
                {Object.keys(this.options).map(id => (
                    <option key={id} value={id}>{this.options[id]}</option>
                ))}
            </select>
        );
    };
}
