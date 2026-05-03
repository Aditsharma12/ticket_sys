'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BubbleBackground from '@/components/BubbleBackground';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage(null);

        if (username.length < 3) return setMessage({ text: 'Username must be at least 3 characters.', type: 'error' });
        if (password.length < 6) return setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
        if (password !== confirmPassword) return setMessage({ text: 'Passwords do not match.', type: 'error' });

        setLoading(true);
        try {
            const res = await fetch(`${API}/api/register/`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, confirm_password: confirmPassword }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                setMessage({ text: 'Account created! Redirecting to login…', type: 'success' });
                setTimeout(() => router.push('/login'), 1200);
            } else {
                setMessage({ text: data.message || 'Registration failed.', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Could not connect to the server.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    const cardStyle: React.CSSProperties = {
        background: 'rgba(4, 16, 30, 0.80)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '45px',
        borderRadius: '36px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid rgba(64,224,255,0.3)',
        animation: 'slideIn 0.5s ease-out',
        transition: 'all 0.3s ease',
    };

    return (
        <>
            <BubbleBackground />
            <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', position: 'relative', zIndex: 10 }}>
                <div style={cardStyle}>
                    <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '10px', fontSize: '2.2rem', fontWeight: 800, textShadow: '0 0 20px rgba(64,224,255,0.6)' }}>
                        🎫 Create Account
                    </h1>
                    <p style={{ textAlign: 'center', color: 'rgba(220,245,255,0.9)', marginBottom: '32px', fontSize: '1rem' }}>
                        Join EventPass
                    </p>

                    {message && <div className={`alert alert-${message.type}`} style={{ marginBottom: '20px' }}>{message.text}</div>}

                    <form onSubmit={handleSubmit}>
                        {[
                            { label: 'Username', value: username, setter: setUsername, type: 'text', placeholder: 'At least 3 characters' },
                            { label: 'Password', value: password, setter: setPassword, type: 'password', placeholder: 'At least 6 characters' },
                            { label: 'Confirm Password', value: confirmPassword, setter: setConfirmPassword, type: 'password', placeholder: 'Repeat your password' },
                        ].map(({ label, value, setter, type, placeholder }) => (
                            <div key={label} style={{ marginBottom: '22px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', color: '#c0e4ff', fontWeight: 600 }}>{label}</label>
                                <input
                                    className="input-ocean"
                                    type={type}
                                    value={value}
                                    onChange={e => setter(e.target.value)}
                                    placeholder={placeholder}
                                    required
                                />
                            </div>
                        ))}

                        <button type="submit" className="btn-ocean" disabled={loading}
                            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '8px', textAlign: 'center' }}>
                            {loading ? 'Creating…' : 'Create Account'}
                        </button>
                    </form>

                    {/* Requirements box */}
                    <div style={{
                        background: 'rgba(4, 16, 30, 0.5)',
                        backdropFilter: 'blur(8px)',
                        padding: '18px 22px',
                        borderRadius: '20px',
                        marginTop: '28px',
                        border: '1px solid rgba(64,224,255,0.2)',
                    }}>
                        <h4 style={{ color: 'white', marginBottom: '10px', fontSize: '1rem', textShadow: '0 0 8px rgba(64,224,255,0.5)' }}>Requirements:</h4>
                        <ul style={{ marginLeft: '20px', color: '#d0e8ff', fontSize: '0.9rem', lineHeight: '1.8' }}>
                            <li>Username: at least 3 characters</li>
                            <li>Password: at least 6 characters</li>
                            <li>Passwords must match</li>
                        </ul>
                    </div>

                    <p style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(220,245,255,0.85)', fontSize: '0.95rem' }}>
                        Already have an account?{' '}
                        <Link href="/login" style={{ color: '#b0e4ff', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid rgba(64,224,255,0.5)' }}>
                            Log in here
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
