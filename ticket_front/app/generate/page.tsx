'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BubbleBackground from '@/components/BubbleBackground';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Ticket { id: string; qr_image: string; }
interface Design { event_name: string; ticket_type: string; price: number; }

export default function GeneratePage() {
    const router = useRouter();
    const [count, setCount] = useState(5);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [design, setDesign] = useState<Design | null>(null);
    const [generating, setGenerating] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (!localStorage.getItem('kiet_user')) { router.replace('/login'); return; }
        const saved = localStorage.getItem('kiet_design');
        if (saved) setDesign(JSON.parse(saved));
    }, [router]);

    async function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        setGenerating(true);
        setTickets([]);
        setMsg('');

        try {
            const res = await fetch(`${API}/api/generate/`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count, design }),
            });
            const data = await res.json();
            if (data.tickets) {
                setTickets(data.tickets);
                setMsg(`${data.tickets.length} ticket(s) generated. Print or download them for distribution.`);
            }
        } catch {
            setMsg('Error generating tickets. Make sure Django is running.');
        } finally {
            setGenerating(false);
        }
    }

    async function handleDownload() {
        const ticketIds = tickets.map(t => t.id);
        const res = await fetch(`${API}/api/download-tickets/`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticket_ids: ticketIds, design }),
        });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'event_tickets.zip'; a.click();
        URL.revokeObjectURL(url);
    }

    const controlCard: React.CSSProperties = {
        background: 'rgba(4,16,30,0.7)',
        backdropFilter: 'blur(12px)',
        padding: '24px 28px',
        borderRadius: '28px',
        marginBottom: '36px',
        maxWidth: '640px',
        width: '100%',
        margin: '0 auto 36px',
        border: '1px solid rgba(64,224,255,0.25)',
        boxShadow: '0 10px 30px rgba(0,50,100,0.2)',
    };

    return (
        <>
            <BubbleBackground />
            <div style={{ minHeight: '100vh', padding: '28px 20px', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
                        <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>
                    </div>

                    <h1 className="page-title">🎟️ Event Ticket Generator</h1>

                    {/* Controls Card */}
                    <div style={controlCard}>
                        {/* Design Info */}
                        {design ? (
                            <div style={{ background: 'rgba(8,24,40,0.6)', padding: '16px 20px', borderRadius: '18px', marginBottom: '20px', border: '1px solid rgba(64,224,255,0.2)' }}>
                                <h3 style={{ color: '#a0e0ff', marginBottom: '8px', fontSize: '1.1rem' }}>Current Design:</h3>
                                <p style={{ color: 'rgba(200,240,255,0.9)', fontSize: '0.9rem' }}><strong>Event:</strong> {design.event_name}</p>
                                <p style={{ color: 'rgba(200,240,255,0.9)', fontSize: '0.9rem' }}>
                                    <strong>Type:</strong> {design.ticket_type === 'paid' ? `Paid (₹${design.price})` : 'Free Entry'}
                                </p>
                                <Link href="/design" style={{ color: '#b0e4ff', fontSize: '0.88rem', marginTop: '8px', display: 'inline-block', borderBottom: '1px solid rgba(64,224,255,0.4)' }}>
                                    ✏️ Edit Design
                                </Link>
                            </div>
                        ) : (
                            <div style={{ background: 'rgba(8,24,40,0.6)', padding: '16px 20px', borderRadius: '18px', marginBottom: '20px', border: '1px solid rgba(64,224,255,0.2)' }}>
                                <h3 style={{ color: '#a0e0ff', marginBottom: '6px' }}>No custom design set</h3>
                                <p style={{ color: 'rgba(200,240,255,0.9)', fontSize: '0.9rem' }}>
                                    Using default design.{' '}
                                    <Link href="/design" style={{ color: '#b0e4ff', borderBottom: '1px solid rgba(64,224,255,0.4)' }}>🎨 Create Design</Link>
                                </p>
                            </div>
                        )}

                        {/* Generate Form */}
                        <form onSubmit={handleGenerate} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'center' }}>
                            <label style={{ color: '#b0e0ff', fontWeight: 600 }}>Number of Tickets:</label>
                            <input type="number" value={count} min={1} max={100} onChange={e => setCount(parseInt(e.target.value))}
                                style={{ padding: '10px 16px', borderRadius: '40px', border: '1px solid rgba(64,224,255,0.3)', background: 'rgba(4,16,30,0.7)', color: 'white', width: '90px', fontSize: '1rem', outline: 'none' }} />
                            <button type="submit" className="btn-ocean" disabled={generating} style={{ padding: '10px 28px', fontSize: '0.95rem' }}>
                                {generating ? 'Generating…' : 'Generate Tickets'}
                            </button>
                        </form>

                        {tickets.length > 0 && (
                            <div style={{ textAlign: 'center', marginTop: '14px' }}>
                                <button onClick={handleDownload} className="btn-ocean"
                                    style={{ background: 'linear-gradient(135deg, #0a5a5a, #064a4a)', padding: '10px 28px', fontSize: '0.95rem' }}>
                                    📥 Download All as ZIP
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Ticket Grid */}
                    {tickets.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '28px', width: '100%' }}>
                            {tickets.map((t) => (
                                <div key={t.id} className="glass-card" style={{ padding: '18px', width: 'fit-content' }}>
                                    <img src={`data:image/png;base64,${t.qr_image}`} alt="Ticket" style={{ display: 'block', maxWidth: '340px', borderRadius: '14px', filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.5))' }} />
                                </div>
                            ))}
                        </div>
                    )}

                    {msg && (
                        <div style={{ marginTop: '32px', padding: '16px 24px', background: 'rgba(4,16,30,0.4)', backdropFilter: 'blur(8px)', borderRadius: '40px', border: '1px solid rgba(64,224,255,0.15)', color: 'rgba(200,240,255,0.8)', fontStyle: 'italic', textAlign: 'center', maxWidth: '640px' }}>
                            {msg}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
