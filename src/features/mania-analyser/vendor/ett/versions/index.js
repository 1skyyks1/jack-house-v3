import createMinaCalc723 from "./minaclac-72.3.js";

const ETTERNA_VERSION_LOADERS = Object.freeze({
    "0.72.3": createMinaCalc723,
});

export const DEFAULT_ETTERNA_VERSION = "0.72.3";

export function listEtternaVersions() {
    return Object.keys(ETTERNA_VERSION_LOADERS);
}

export function normalizeEtternaVersion(value) {
    const normalized = String(value || "").trim();
    return ETTERNA_VERSION_LOADERS[normalized]
        ? normalized
        : DEFAULT_ETTERNA_VERSION;
}

export function resolveEtternaVersionLoaderForKeycount(value, keycount) {
    if (Number(keycount) !== 4) {
        throw new Error(`Unsupported keycount: ${keycount}`);
    }

    const requestedVersion = normalizeEtternaVersion(value);
    return {
        requestedVersion,
        version: requestedVersion,
        loader: ETTERNA_VERSION_LOADERS[requestedVersion],
        fallbackReason: null,
    };
}
