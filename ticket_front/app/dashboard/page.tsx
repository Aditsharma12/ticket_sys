'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BubbleBackground from '@/components/BubbleBackground';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Stats {
    total_tickets: number;
    used_tickets: number;
    available_tickets: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [username, setUsername] = useState('User');
    const [stats, setStats] = useState<Stats>({ total_tickets: 0, used_tickets: 0, available_tickets: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('kiet_user');
        if (!stored) {
            router.replace('/login');
            return;
        }
        const user = JSON.parse(stored);
        setUsername(user.username);

        fetch(`${API}/api/dashboard/`, { credentials: 'include' })
            .then(r => r.json())
            .then(d => {
                // Only update stats if we got real data – never redirect on API failure
                if (d.total_tickets !== undefined) {
                    setStats(d);
                }
            })
            .catch(() => {/* show 0 stats gracefully */ })
            .finally(() => setLoading(false));
    }, [router]);

    function handleLogout() {
        localStorage.removeItem('kiet_user');
        fetch(`${API}/api/logout/`, { method: 'POST', credentials: 'include' }).finally(() => router.push('/login'));
    }

    const statCards = [
        { icon: '🎫', number: stats.total_tickets, label: 'Total Tickets' },
        { icon: '✅', number: stats.used_tickets, label: 'Used Tickets' },
        { icon: '📋', number: stats.available_tickets, label: 'Available Tickets' },
    ];

    const actionCards = [
        { icon: '🎨', title: 'Design Tickets', desc: 'Customize your ticket design with colors, event name, and pricing', link: '/design', btnText: 'Configure Design' },
        { icon: '🎫', title: 'Generate Tickets', desc: 'Create new event tickets with QR codes for distribution', link: '/generate', btnText: 'Generate Tickets' },
        { icon: '📱', title: 'Gate Scanner', desc: 'Scan and validate tickets at event entrance using QR scanner', link: '/scanner', btnText: 'Open Scanner' },
    ];

    return (
        <>
            <BubbleBackground />
            <div style={{ minHeight: '100vh', padding: '20px', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                    {/* NAVBAR */}
                    <nav style={{
                        background: 'rgba(4,16,30,0.75)',
                        backdropFilter: 'blur(12px)',
                        padding: '18px 28px',
                        borderRadius: '20px',
                        marginBottom: '28px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid rgba(64,224,255,0.3)',
                        boxShadow: '0 8px 25px rgba(0,100,200,0.2)',
                        transition: 'all 0.3s ease',
                    }}>
                        <h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700, textShadow: '0 0 15px rgba(64,224,255,0.5)' }}>
                            🎫 EventPass
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{
                                color: '#b0e0ff',
                                fontWeight: 600,
                                background: 'rgba(0,100,200,0.2)',
                                padding: '8px 18px',
                                borderRadius: '30px',
                                border: '1px solid rgba(64,224,255,0.4)',
                            }}>👤 {username}</span>
                            <button onClick={handleLogout} className="btn-ocean" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
                                Logout
                            </button>
                        </div>
                    </nav>

                    {/* WELCOME */}
                    <div style={{
                        background: 'rgba(4,16,30,0.7)',
                        backdropFilter: 'blur(12px)',
                        padding: '36px',
                        borderRadius: '28px',
                        marginBottom: '28px',
                        textAlign: 'center',
                        border: '1px solid rgba(64,224,255,0.25)',
                        boxShadow: '0 10px 30px rgba(0,50,100,0.2)',
                        transition: 'all 0.3s ease',
                    }}>
                        <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px', textShadow: '0 0 20px rgba(64,224,255,0.5)' }}>
                            Welcome, {username}! 👋
                        </h1>
                        <p style={{ color: 'rgba(200,240,255,0.95)', fontSize: '1.05rem' }}>
                            Manage your event tickets and track entries from your dashboard
                        </p>
                    </div>

                    {/* STATS GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                        {statCards.map(({ icon, number, label }) => (
                            <div key={label} className="glass-card" style={{ padding: '28px', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '12px', filter: 'drop-shadow(0 0 15px rgba(64,224,255,0.6))' }}>{icon}</div>
                                <div style={{ fontSize: '3rem', fontWeight: 700, color: 'white', marginBottom: '8px', textShadow: '0 0 20px rgba(64,224,255,0.6)' }}>
                                    {loading ? '…' : number}
                                </div>
                                <div style={{ color: 'rgba(200,240,255,0.9)', fontSize: '0.95rem' }}>{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* ACTIONS GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        {actionCards.map(({ icon, title, desc, link, btnText }) => (
                            <div key={title} className="glass-card" style={{ padding: '28px' }}>
                                <h3 style={{ color: 'white', fontSize: '1.4rem', marginBottom: '12px', textShadow: '0 0 15px rgba(64,224,255,0.5)' }}>
                                    {icon} {title}
                                </h3>
                                <p style={{ color: 'rgba(200,240,255,0.9)', fontSize: '0.95rem', marginBottom: '22px', lineHeight: '1.5' }}>{desc}</p>
                                <Link href={link} className="btn-ocean" style={{ fontSize: '0.9rem', padding: '10px 22px' }}>{btnText}</Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
