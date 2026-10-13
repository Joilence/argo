export const ZONES = [
    'bottom-center',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'center',
];
export const TEMPLATE_TYPES = [
    'lower-third',
    'headline-card',
    'callout',
    'image-card',
    'arrow',
];
export const MOTIONS = ['none', 'fade-in', 'slide-in'];
export const ARROW_DIRECTIONS = [
    'up', 'down', 'left', 'right',
    'up-left', 'up-right', 'down-left', 'down-right',
];
// ─── Effects ──────────────────────────────────────────────────────────────
export const EFFECT_TYPES = ['confetti', 'spotlight', 'focus-ring', 'dim-around', 'zoom-to'];
export const CONFETTI_SPREADS = ['burst', 'rain'];
export function isValidEffectType(value) {
    return EFFECT_TYPES.includes(value);
}
export function isValidZone(value) {
    return ZONES.includes(value);
}
export function isValidTemplateType(value) {
    return TEMPLATE_TYPES.includes(value);
}
export function isValidMotion(value) {
    if (typeof value === 'string') {
        return MOTIONS.includes(value);
    }
    if (typeof value === 'object' && value !== null) {
        return value.type === 'gsap';
    }
    return false;
}
export function isValidMotionName(value) {
    return MOTIONS.includes(value);
}
//# sourceMappingURL=types.js.map