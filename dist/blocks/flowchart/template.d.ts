import type { BlockDefinition } from '../types.js';
export type FlowchartNodeKind = 'default' | 'success' | 'warn' | 'accent';
export interface FlowchartNode {
    label: string;
    kind?: FlowchartNodeKind;
}
export interface FlowchartProps {
    title?: string;
    nodes: FlowchartNode[];
    accentColor?: string;
    [key: string]: unknown;
}
export declare const flowchartBlock: BlockDefinition<FlowchartProps>;
//# sourceMappingURL=template.d.ts.map