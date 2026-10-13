import { escapeHtml } from '../../html-escape.js';
function render(props, theme) {
    const isDark = theme === 'dark';
    const fg = isDark ? '#f5f5f7' : '#1a1a1f';
    const muted = isDark ? 'rgba(245,245,247,0.7)' : 'rgba(26,26,31,0.65)';
    const perspective = typeof props.perspective === 'number' && props.perspective > 0 ? props.perspective : 1200;
    const captionHtml = props.caption
        ? `<div class="argo-3d-caption" style="font-size:13px;color:${muted};margin-top:14px;text-align:center;letter-spacing:0.01em">${escapeHtml(props.caption)}</div>`
        : '';
    return {
        contentHtml: `
      <div style="perspective:${perspective}px;perspective-origin:50% 30%">
        <img class="argo-3d-image" src="${escapeHtml(props.image)}" alt="" style="display:block;max-width:100%;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,0.45);transform-origin:50% 50%;transform-style:preserve-3d" />
        ${captionHtml}
      </div>
    `.trim(),
        styles: {
            padding: '12px',
            maxWidth: '480px',
            color: fg,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        },
    };
}
function buildMotion(tiltDeg) {
    return {
        type: 'gsap',
        in: {
            from: {
                opacity: 0,
                rotationX: tiltDeg,
                y: 40,
                scale: 0.92,
            },
            duration: 0.7,
            ease: 'power3.out',
            target: '.argo-3d-image',
        },
        loop: {
            to: { rotationX: 4 },
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            target: '.argo-3d-image',
        },
        out: {
            to: { opacity: 0, scale: 0.96 },
            duration: 0.3,
            ease: 'power2.in',
            target: '.argo-3d-image',
        },
    };
}
export const ui3dRevealBlock = {
    id: 'ui-3d-reveal',
    version: '1.0.0',
    defaultProps: {
        image: '',
        tiltDeg: 35,
        perspective: 1200,
    },
    render,
    defaultMotion: buildMotion(35),
};
//# sourceMappingURL=template.js.map