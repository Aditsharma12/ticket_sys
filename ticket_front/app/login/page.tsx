'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BubbleBackground from '@/components/BubbleBackground';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // If already logged in, redirect to dashboard
        if (localStorage.getItem('kiet_user')) {
            router.replace('/dashboard');
        }
    }, [router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch(`${API}/api/login/`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (data.status === 'success') {
                localStorage.setItem('kiet_user', JSON.stringify({ username: data.username, userId: data.user_id }));
                setMessage({ text: `Welcome back, ${data.username}!`, type: 'success' });
                setTimeout(() => router.push('/dashboard'), 500);
            } else {
                setMessage({ text: data.message || 'Invalid username or password.', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Could not connect to the server. Make sure Django is running.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <BubbleBackground />
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                position: 'relative',
                zIndex: 10,
            }}>
                <div style={{
                    background: 'rgba(4, 16, 30, 0.80)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    padding: '45px',
                    borderRadius: '36px',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(64,224,255,0.3)',
                    maxWidth: '500px',
                    width: '100%',
                    animation: 'slideIn 0.5s ease-out',
                    border: '1px solid rgba(64,224,255,0.3)',
                }}>
                    <h1 style={{
                        color: 'white',
                        textAlign: 'center',
                        marginBottom: '10px',
                        fontSize: '2.2rem',
                        fontWeight: 800,
                        textShadow: '0 0 20px rgba(64,224,255,0.6)',
                    }}>🎫 Welcome Back</h1>

                    <p style={{
                        textAlign: 'center',
                        color: 'rgba(220,245,255,0.9)',
                        marginBottom: '32px',
                        fontSize: '1rem',
                    }}>Sign in to EventPass</p>

                    {message && (
                        <div className={`alert alert-${message.type}`} style={{ marginBottom: '20px' }}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', color: '#c0e4ff', fontWeight: 600, fontSize: '1rem' }}>
                                Username
                            </label>
                            <input
                                className="input-ocean"
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                                autoFocus
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', color: '#c0e4ff', fontWeight: 600, fontSize: '1rem' }}>
                                Password
                            </label>
                            <input
                                className="input-ocean"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-ocean"
                            disabled={loading}
                            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '8px', textAlign: 'center' }}
                        >
                            {loading ? 'Logging in…' : 'Log In'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(220,245,255,0.85)', fontSize: '0.95rem' }}>
                        Don&apos;t have an account?{' '}
                        <Link href="/register" style={{ color: '#b0e4ff', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid rgba(64,224,255,0.5)' }}>
                            Create one here
                        </Link>
                    </p>
                </div>
            </div>

            <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </>
    );
}
