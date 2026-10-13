import type { BlockDefinition } from '../types.js';
export interface DataChartProps {
    type: 'bar' | 'line';
    title: string;
    values: number[];
    labels?: string[];
    accentColor?: string;
    [key: string]: unknown;
}
export declare const dataChartBlock: BlockDefinition<DataChartProps>;
//# sourceMappingURL=template.d.ts.map