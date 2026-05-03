'use client';

// Shared animated floating bubble background – used on every page.
// Matches the 15-bubble layout from the original Django templates.
const bubbles = [
    { cls: 'deep-blue-1', w: 180, h: 180, top: '10%', left: '5%', dur: '22s', delay: '0s', bg: 'radial-gradient(circle at 30% 30%, rgba(0,191,255,0.4), rgba(0,105,148,0.3))', border: 'rgba(0,191,255,0.3)', shadow: '0 0 50px rgba(0,191,255,0.2)' },
    { cls: 'deep-blue-2', w: 120, h: 120, top: '40%', right: '15%', dur: '25s', delay: '3s', bg: 'radial-gradient(circle at 30% 30%, rgba(70,130,180,0.45), rgba(25,85,125,0.35))', border: 'rgba(70,130,180,0.3)', shadow: '0 0 45px rgba(70,130,180,0.25)' },
    { cls: 'deep-blue-3', w: 90, h: 90, bottom: '30%', left: '20%', dur: '19s', delay: '2s', bg: 'radial-gradient(circle at 30% 30%, rgba(30,144,255,0.5), rgba(0,90,156,0.4))', border: 'rgba(30,144,255,0.35)', shadow: '0 0 40px rgba(30,144,255,0.3)' },
    { cls: 'aqua-1', w: 200, h: 200, top: '20%', right: '25%', dur: '24s', delay: '1s', bg: 'radial-gradient(circle at 30% 30%, rgba(64,224,208,0.45), rgba(0,139,139,0.35))', border: 'rgba(64,224,208,0.3)', shadow: '0 0 55px rgba(64,224,208,0.25)' },
    { cls: 'aqua-2', w: 140, h: 140, bottom: '20%', right: '35%', dur: '21s', delay: '4s', bg: 'radial-gradient(circle at 30% 30%, rgba(72,209,204,0.5), rgba(32,178,170,0.4))', border: 'rgba(72,209,204,0.35)', shadow: '0 0 48px rgba(72,209,204,0.3)' },
    { cls: 'aqua-3', w: 70, h: 70, top: '70%', left: '35%', dur: '17s', delay: '5s', bg: 'radial-gradient(circle at 30% 30%, rgba(0,206,209,0.55), rgba(0,139,139,0.45))', border: 'rgba(0,206,209,0.4)', shadow: '0 0 35px rgba(0,206,209,0.35)' },
    { cls: 'cyan-1', w: 160, h: 160, top: '50%', left: '45%', dur: '23s', delay: '2.5s', bg: 'radial-gradient(circle at 30% 30%, rgba(137,207,240,0.5), rgba(100,149,237,0.4))', border: 'rgba(137,207,240,0.35)', shadow: '0 0 52px rgba(137,207,240,0.3)' },
    { cls: 'cyan-2', w: 100, h: 100, bottom: '15%', left: '65%', dur: '20s', delay: '3.5s', bg: 'radial-gradient(circle at 30% 30%, rgba(173,216,230,0.55), rgba(135,206,235,0.45))', border: 'rgba(173,216,230,0.4)', shadow: '0 0 42px rgba(173,216,230,0.35)' },
    { cls: 'cyan-3', w: 85, h: 85, top: '80%', right: '45%', dur: '18s', delay: '6s', bg: 'radial-gradient(circle at 30% 30%, rgba(135,206,250,0.6), rgba(70,130,200,0.5))', border: 'rgba(135,206,250,0.45)', shadow: '0 0 38px rgba(135,206,250,0.4)' },
    { cls: 'turq-1', w: 150, h: 150, top: '15%', left: '75%', dur: '26s', delay: '0.8s', bg: 'radial-gradient(circle at 30% 30%, rgba(64,224,208,0.45), rgba(0,128,128,0.35))', border: 'rgba(64,224,208,0.3)', shadow: '0 0 48px rgba(64,224,208,0.25)' },
    { cls: 'turq-2', w: 95, h: 95, bottom: '40%', right: '55%', dur: '22s', delay: '4.8s', bg: 'radial-gradient(circle at 30% 30%, rgba(32,178,170,0.5), rgba(0,128,128,0.4))', border: 'rgba(32,178,170,0.35)', shadow: '0 0 44px rgba(32,178,170,0.3)' },
    { cls: 'navy-1', w: 220, h: 220, bottom: '10%', left: '10%', dur: '28s', delay: '0.3s', bg: 'radial-gradient(circle at 30% 30%, rgba(0,0,128,0.35), rgba(25,25,112,0.3))', border: 'rgba(100,149,237,0.25)', shadow: '0 0 60px rgba(0,0,139,0.2)' },
    { cls: 'navy-2', w: 130, h: 130, top: '60%', left: '85%', dur: '27s', delay: '5.5s', bg: 'radial-gradient(circle at 30% 30%, rgba(72,61,139,0.4), rgba(25,25,112,0.35))', border: 'rgba(106,90,205,0.3)', shadow: '0 0 46px rgba(72,61,139,0.25)' },
    { cls: 'glass-1', w: 110, h: 110, top: '35%', left: '55%', dur: '29s', delay: '7s', bg: 'radial-gradient(circle at 30% 30%, rgba(176,224,230,0.3), rgba(176,224,230,0.1))', border: 'rgba(255,255,255,0.4)', shadow: '0 0 40px rgba(176,224,230,0.25)' },
    { cls: 'glass-2', w: 75, h: 75, bottom: '50%', left: '30%', dur: '16s', delay: '8.2s', bg: 'radial-gradient(circle at 30% 30%, rgba(224,255,255,0.35), rgba(224,255,255,0.15))', border: 'rgba(255,255,255,0.45)', shadow: '0 0 36px rgba(224,255,255,0.3)' },
];

const bubbleStyle: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    backdropFilter: 'blur(3px)',
    animationName: 'float',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    cursor: 'pointer',
};

const containerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
};

export default function BubbleBackground() {
    return (
        <div style={containerStyle}>
            {bubbles.map((b) => (
                <div
                    key={b.cls}
                    style={{
                        ...bubbleStyle,
                        width: b.w,
                        height: b.h,
                        top: 'top' in b ? b.top : undefined,
                        bottom: 'bottom' in b ? (b as any).bottom : undefined,
                        left: 'left' in b ? b.left : undefined,
                        right: 'right' in b ? (b as any).right : undefined,
                        animationDuration: b.dur,
                        animationDelay: b.delay,
                        background: b.bg,
                        border: `1px solid ${b.border}`,
                        boxShadow: b.shadow,
                        pointerEvents: 'auto',
                    }}
                />
            ))}
        </div>
    );
}
