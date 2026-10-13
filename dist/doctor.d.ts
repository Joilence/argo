interface CheckResult {
    name: string;
    status: 'ok' | 'warn' | 'fail';
    message: string;
}
export declare function runDoctor(cwd?: string): Promise<CheckResult[]>;
export declare function formatDoctorResults(results: CheckResult[]): string;
export {};
//# sourceMappingURL=doctor.d.ts.map