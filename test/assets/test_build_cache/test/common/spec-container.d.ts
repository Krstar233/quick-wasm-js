export interface SpecResult {
    success: boolean;
    passCount: number;
    errMsg: string;
}
export declare function it(title: string, fn: (done: () => void) => void): void;
export declare function beforeAll(fn: (done: () => void) => void): void;
export declare function afterAll(fn: (done: () => void) => void): void;
export declare function spec(title: string, builder: Function): Function;
export declare function runTests(): Promise<SpecResult>;
