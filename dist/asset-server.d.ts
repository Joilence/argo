export interface AssetServer {
    url: string;
    port: number;
    close: () => Promise<void>;
}
export declare function startAssetServer(assetDir: string): Promise<AssetServer>;
//# sourceMappingURL=asset-server.d.ts.map