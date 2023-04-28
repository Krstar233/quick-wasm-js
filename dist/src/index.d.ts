/**
 * @class QuickWebAssemblyFactory
 */
export declare class QuickWebAssemblyFactory {
    constructor();
    /**
     *
     * @returns {string} Hello
     */
    greet(): string;
    /**
     * CreateManager
     * @param moduleUrl moduleUrl
     * @param wasmUrl wasmUrl
     * @returns Object
     */
    createManager(moduleUrl: string, wasmUrl?: string): Promise<any>;
}
