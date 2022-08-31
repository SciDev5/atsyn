import { css } from "@emotion/css";
import React, { useId, useState } from "react";
import Styles from "../../../css/Styles";
import Node, { RowInitData } from "../../../nodeGraph/Node";
import { PortSide } from "../../../nodeGraph/PortSide";
import Row from "../../../nodeGraph/Row";
import ValueTarget, { ValueSource } from "../../../util/ValueTarget";

export default class InputRow extends Row {
    constructor(
        rowInitData:RowInitData<Node>,
        private readonly label:string|((k:{value:number,nConnections:number,connected:boolean})=>string),
        defaultValue:number,
        private readonly validate:(v:number)=>boolean = ()=>true,
    ) {
        super(rowInitData, [PortSide.INPUT]);
        this.valueSource = new ValueSource(defaultValue);
        this.valueTarget = this.valueSource.target;
    }
    get port() { return this.portIn_! }

    private valueOnConnected?:number;
    setValueOnConnected(value:number) {
        this.valueOnConnected = value;
        return this;
    }

    private readonly valueSource:ValueSource<number>;
    readonly valueTarget:ValueTarget<number>;
    get value() {
        return (
            this.port.nConnections.value > 0 ? this.valueOnConnected : null
        ) ?? this.valueTarget.value;
    }
    set value(value:number) {
        if (this.validate(value))
            this.valueSource.assign(value);
    }

    readonly height = 30;
    readonly Component = ()=>{
        const [value,setValue] = useState(this.value.toString());
        const nConnections = this.port.nConnections.useState(), connected = nConnections > 0;
        const showInput = !(connected && this.valueOnConnected !== undefined);
        const id = useId();
        return (
            <label
                htmlFor={id}
                className={css({
                    display:"flex",
                    lineHeight: this.height+"px",
                    paddingInline: ".5em",
                })}
            >
                <span className={css({
                    flex: "0.5 0 4em",
                })}>
                    {typeof this.label === "string" ?
                        this.label :
                        this.label({value:this.value,connected,nConnections})
                    }
                </span>
                { showInput && (
                    <input
                        type={"number"}
                        className={css(
                            {
                                flex: "1",
                                minWidth: 50,
                            },
                            Styles.input(),
                        )}
                        {...{id,value}}
                        onChange={e=>{
                            const { value } = e.currentTarget, parsedValue = parseFloat(value);
                            setValue(value);
                            if (isFinite(parsedValue))
                                this.value = parsedValue;
                        }}
                        onBlur={e=>{
                            setValue(this.value.toString());
                        }}
                    />
                )}
            </label>
        );
    };
}