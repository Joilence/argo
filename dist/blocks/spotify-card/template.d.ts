import type { BlockDefinition } from '../types.js';
export interface SpotifyCardProps {
    track: string;
    artist: string;
    albumArt?: string;
    elapsed: number;
    total: number;
    [key: string]: unknown;
}
export declare const spotifyCardBlock: BlockDefinition<SpotifyCardProps>;
//# sourceMappingURL=template.d.ts.map