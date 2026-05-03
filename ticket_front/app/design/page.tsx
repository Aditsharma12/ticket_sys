'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BubbleBackground from '@/components/BubbleBackground';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DesignPage() {
    const router = useRouter();
    const [eventName, setEventName] = useState('My Event');
    const [ticketType, setTicketType] = useState<'entry' | 'paid'>('entry');
    const [price, setPrice] = useState('500');
    const [primaryColor, setPrimaryColor] = useState('#2563eb');
    const [secondaryColor, setSecondaryColor] = useState('#1e40af');
    const [bgStyle, setBgStyle] = useState<'gradient' | 'solid'>('gradient');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (!localStorage.getItem('kiet_user')) router.replace('/login');
        // Load saved design from localStorage
        const saved = localStorage.getItem('kiet_design');
        if (saved) {
            const d = JSON.parse(saved);
            setEventName(d.event_name || 'My Event');
            setTicketType(d.ticket_type || 'entry');
            setPrice(d.price || '500');
            setPrimaryColor(d.primary_color || '#2563eb');
            setSecondaryColor(d.secondary_color || '#1e40af');
            setBgStyle(d.background_style || 'gradient');
        }
    }, [router]);

    const previewBg = bgStyle === 'gradient'
        ? `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`
        : primaryColor;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const design = { event_name: eventName, ticket_type: ticketType, price: parseInt(price), primary_color: primaryColor, secondary_color: secondaryColor, background_style: bgStyle };
        localStorage.setItem('kiet_design', JSON.stringify(design));

        try {
            await fetch(`${API}/api/save-design/`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(design),
            });
        } catch { }
        setMsg('Design saved! Redirecting to ticket generator…');
        setTimeout(() => router.push('/generate'), 1000);
        setSaving(false);
    }

    const cardStyle: React.CSSProperties = {
        background: 'rgba(4,16,30,0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '25px',
        border: '1px solid rgba(64,224,255,0.25)',
        boxShadow: '0 10px 30px rgba(0,50,100,0.2)',
        padding: '30px',
        transition: 'all 0.3s ease',
    };

    return (
        <>
            <BubbleBackground />
            <div style={{ minHeight: '100vh', padding: '30px 20px', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>

                    <h1 className="page-title">🎨 Design Your Tickets</h1>

                    {msg && <div className="alert alert-success" style={{ marginBottom: '24px', textAlign: 'center' }}>{msg}</div>}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px', alignItems: 'stretch' }}>
                        {/* FORM SECTION */}
                        <div style={cardStyle}>
                            <form onSubmit={handleSubmit}>
                                {/* Event Name */}
                                <div style={{ marginBottom: '22px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#b0e0ff', fontWeight: 600, fontSize: '1.05rem' }}>Event Name</label>
                                    <input className="input-ocean" type="text" style={{ borderRadius: '12px' }} value={eventName}
                                        onChange={e => setEventName(e.target.value)} placeholder="Tech Fest 2026" required />
                                </div>

                                {/* Ticket Type */}
                                <div style={{ marginBottom: '22px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#b0e0ff', fontWeight: 600, fontSize: '1.05rem' }}>Ticket Type</label>
                                    <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                                        {(['entry', 'paid'] as const).map(t => (
                                            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#d0e8ff' }}>
                                                <input type="radio" value={t} checked={ticketType === t} onChange={() => setTicketType(t)}
                                                    style={{ accentColor: '#40e0ff', width: '18px', height: '18px' }} />
                                                {t === 'entry' ? 'Free Entry' : 'Paid'}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Price */}
                                {ticketType === 'paid' && (
                                    <div style={{ marginBottom: '22px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#b0e0ff', fontWeight: 600, fontSize: '1.05rem' }}>Price (₹)</label>
                                        <input className="input-ocean" type="number" style={{ borderRadius: '12px' }} value={price}
                                            onChange={e => setPrice(e.target.value)} min="0" placeholder="500" />
                                    </div>
                                )}

                                {/* Primary Color */}
                                <div style={{ marginBottom: '22px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#b0e0ff', fontWeight: 600, fontSize: '1.05rem' }}>Primary Color</label>
                                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                                        style={{ width: '100%', height: '56px', borderRadius: '12px', border: '1px solid rgba(64,224,255,0.3)', background: 'rgba(4,16,30,0.7)', cursor: 'pointer' }} />
                                </div>

                                {/* Secondary Color */}
                                <div style={{ marginBottom: '22px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#b0e0ff', fontWeight: 600, fontSize: '1.05rem' }}>Secondary Color</label>
                                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                                        style={{ width: '100%', height: '56px', borderRadius: '12px', border: '1px solid rgba(64,224,255,0.3)', background: 'rgba(4,16,30,0.7)', cursor: 'pointer' }} />
                                </div>

                                {/* Background Style */}
                                <div style={{ marginBottom: '22px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#b0e0ff', fontWeight: 600, fontSize: '1.05rem' }}>Background Style</label>
                                    <select value={bgStyle} onChange={e => setBgStyle(e.target.value as 'gradient' | 'solid')}
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(64,224,255,0.3)', background: 'rgba(4,16,30,0.8)', color: 'white', fontSize: '1rem' }}>
                                        <option value="gradient">Gradient</option>
                                        <option value="solid">Solid</option>
                                    </select>
                                </div>

                                <button type="submit" className="btn-ocean" disabled={saving}
                                    style={{ width: '100%', padding: '16px', fontSize: '1.1rem', textAlign: 'center', marginTop: '8px' }}>
                                    {saving ? 'Saving…' : '💾 Save Design & Continue'}
                                </button>
                            </form>
                        </div>

                        {/* PREVIEW SECTION */}
                        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <h3 style={{ color: '#b0e0ff', marginBottom: '24px', fontSize: '1.3rem', alignSelf: 'flex-start' }}>Live Preview</h3>
                            <div style={{
                                width: '100%',
                                maxWidth: '520px',
                                height: '230px',
                                borderRadius: '14px',
                                overflow: 'hidden',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                                border: '1px solid rgba(64,224,255,0.2)',
                                display: 'flex',
                                background: previewBg,
                                transition: 'background 0.3s ease',
                            }}>
                                {/* Left */}
                                <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginBottom: '10px' }}>
                                            {(eventName || 'MY EVENT').toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                                            {ticketType === 'paid' ? `PAID ENTRY | ₹${price}` : 'FREE ENTRY'}
                                        </div>
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
                                        <div>TICKET ID: XXXXXXXX</div>
                                        <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>ADMIT ONE</div>
                                    </div>
                                </div>
                                {/* Right - QR placeholder */}
                                <div style={{
                                    width: '140px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    padding: '14px',
                                    paddingBottom: '22px',
                                    background: 'rgba(0,0,0,0.15)',
                                    borderLeft: '2px dashed rgba(255,255,255,0.2)',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: 'white', marginBottom: '6px' }}>SCAN HERE</div>
                                    <div style={{
                                        width: '95px', height: '95px',
                                        background: 'rgba(255,255,255,0.9)',
                                        border: '2px solid #333',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.65rem',
                                        color: '#0a1a2a',
                                        fontWeight: 700,
                                    }}>QR CODE</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
