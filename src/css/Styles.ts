import { CSSInterpolation } from "@emotion/css";

export default class Styles {
    static input():CSSInterpolation {
        return {
            background: "#404045",
            color: "#ffffff",
            border: "1px solid",
            fontFamily: "inherit",
            "&:hover": {
                background: "#606065",
            },
        };
    }
}