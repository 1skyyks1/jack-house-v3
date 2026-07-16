import { rc4KReform } from "./4k-rc-reform.js";
import { ln4K } from "./4k-ln.js";

export const DAN_INDEX = {
    4: {
        RC: { default: rc4KReform},
        LN: { default: ln4K },
    },
};
