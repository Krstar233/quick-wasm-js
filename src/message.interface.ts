export type CmdMessage =
    initCmdMsg |
    callCmdMsg |
    getKeysCmdMsg |
    createHeapCmdMsg |
    freeHeapCmdMsg |
    getHeapCmdMsg;

export interface initCmdMsg {
    cmd: "load",
    args: [string, string?]
}

export interface callCmdMsg {
    cmd: "call",
    args: [
        string,
        any[]
    ]
}

export interface getKeysCmdMsg {
    cmd: "getKeys"
}

export interface createHeapCmdMsg {
    cmd: "createHeap"
    args: [Int8Array]
}

export interface freeHeapCmdMsg {
    cmd: "freeHeap"
    args: [number]
}

export interface getHeapCmdMsg {
    cmd: "getHeap"
    args: [number, number]
}