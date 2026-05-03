'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BubbleBackground from '@/components/BubbleBackground';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type ScanStatus = 'idle' | 'scanning' | 'verifying' | 'success' | 'error';

export default function ScannerPage() {
    const router = useRouter();
    const [status, setStatus] = useState<ScanStatus>('idle');
    const [result, setResult] = useState('');
    const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [running, setRunning] = useState(false);
    const html5QrcodeRef = useRef<any>(null);
    const canScanRef = useRef(true);

    useEffect(() => {
        if (!localStorage.getItem('kiet_user')) { router.replace('/login'); return; }

        // Load html5-qrcode core library
        const existing = document.getElementById('html5qrcode-script');
        if (existing) { initCameras(); return; }

        const script = document.createElement('script');
        script.id = 'html5qrcode-script';
        script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
        script.async = true;
        script.onload = () => initCameras();
        document.head.appendChild(script);

        return () => { stopCamera(); };
    }, [router]);

    async function initCameras() {
        try {
            const devices = await (window as any).Html5Qrcode.getCameras();
            if (devices?.length) {
                setCameras(devices);
                setSelectedCamera(devices[devices.length - 1].id); // prefer back camera
            }
        } catch {
            setResult('Camera access denied. Please allow camera permissions.');
            setStatus('error');
        }
    }

    async function startCamera(camId?: string) {
        const cameraId = camId || selectedCamera;
        if (!cameraId) return;

        await stopCamera();  // must await so old scanner fully stops before new starts
        canScanRef.current = true;

        const scanner = new (window as any).Html5Qrcode('qr-video-region');
        html5QrcodeRef.current = scanner;

        try {
            await scanner.start(
                cameraId,
                {
                    fps: 30,                        // max scan attempts per second
                    qrbox: { width: 280, height: 280 }, // visible scan box
                    aspectRatio: 1.0,
                    disableFlip: false,
                },
                async (decodedText: string) => {
                    if (!canScanRef.current) return;
                    canScanRef.current = false;
                    setStatus('verifying');
                    setResult('Verifying…');

                    try {
                        const res = await fetch(`${API}/api/validate/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code: decodedText }),
                        });
                        const data = await res.json();
                        const msg = data.message || (data.status === 'success' ? 'ENTRY GRANTED' : 'TICKET ERROR');
                        setResult(msg);
                        setStatus(data.status === 'success' ? 'success' : 'error');
                    } catch {
                        setResult('Network error – check Django server');
                        setStatus('error');
                    }

                    // Stay on result for 4s so REJECT/USED message is clearly visible
                    setTimeout(() => {
                        canScanRef.current = true;
                        setStatus('scanning');
                        setResult('');
                    }, 4000);
                },
                () => { } // ignore per-frame errors
            );
            setRunning(true);
            setStatus('scanning');
        } catch (err) {
            setResult('Could not start camera. Try another camera.');
            setStatus('error');
        }
    }

    async function stopCamera() {
        if (html5QrcodeRef.current) {
            try { await html5QrcodeRef.current.stop(); } catch (_) { }
            try { html5QrcodeRef.current.clear(); } catch (_) { }
            html5QrcodeRef.current = null;
        }
        setRunning(false);
        setStatus('idle');
        setResult('');
    }

    const statusUI: Record<ScanStatus, { label: string; color: string; bg: string }> = {
        idle: { label: '', color: 'rgba(180,220,255,0.8)', bg: 'rgba(4,16,30,0.8)' },
        scanning: { label: 'Scanning…', color: 'rgba(180,220,255,0.9)', bg: 'rgba(4,16,30,0.85)' },
        verifying: { label: 'Verifying…', color: '#a0e8ff', bg: 'rgba(4,20,40,0.9)' },
        success: { label: result, color: '#50ffb0', bg: 'rgba(6,50,36,0.95)' },
        error: { label: result, color: '#ff8080', bg: 'rgba(60,10,18,0.95)' },
    };

    const ui = statusUI[status];

    return (
        <>
            <BubbleBackground />
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '24px 16px',
                position: 'relative',
                zIndex: 10,
            }}>
                <div style={{ width: '100%', maxWidth: '540px' }}>
                    <Link href="/dashboard" className="back-link" style={{ marginBottom: '16px' }}>← Dashboard</Link>

                    <h1 style={{
                        color: 'white',
                        fontSize: 'clamp(1.4rem, 4vw, 2rem)',
                        fontWeight: 800,
                        textAlign: 'center',
                        marginBottom: '18px',
                        textShadow: '0 0 20px rgba(64,224,255,0.6)',
                        letterSpacing: '2px',
                    }}>📱 GATE SCANNER</h1>

                    {/* Camera selector */}
                    {cameras.length > 1 && (
                        <select
                            value={selectedCamera}
                            onChange={e => { setSelectedCamera(e.target.value); if (running) startCamera(e.target.value); }}
                            style={{
                                width: '100%',
                                padding: '10px 16px',
                                marginBottom: '14px',
                                borderRadius: '40px',
                                border: '1px solid rgba(64,224,255,0.4)',
                                background: 'rgba(4,16,30,0.85)',
                                color: 'white',
                                fontSize: '0.95rem',
                                outline: 'none',
                            }}
                        >
                            {cameras.map(c => (
                                <option key={c.id} value={c.id}>{c.label || `Camera ${c.id}`}</option>
                            ))}
                        </select>
                    )}

                    {/* Video container */}
                    <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', marginBottom: '16px', border: '2px solid rgba(64,224,255,0.35)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                        {/* html5-qrcode injects <video> here */}
                        <div id="qr-video-region" style={{ width: '100%', background: '#040f1e' }} />

                        {/* Animated scan line (only when scanning) */}
                        {running && (
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                pointerEvents: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                {/* Corner brackets */}
                                {(['tl', 'tr', 'bl', 'br'] as const).map(corner => (
                                    <div key={corner} style={{
                                        position: 'absolute',
                                        width: 44, height: 44,
                                        ...(corner === 'tl' ? { top: 'calc(50% - 140px)', left: 'calc(50% - 140px)', borderTop: '4px solid #40e0ff', borderLeft: '4px solid #40e0ff', borderRadius: '4px 0 0 0' } : {}),
                                        ...(corner === 'tr' ? { top: 'calc(50% - 140px)', right: 'calc(50% - 140px)', borderTop: '4px solid #40e0ff', borderRight: '4px solid #40e0ff', borderRadius: '0 4px 0 0' } : {}),
                                        ...(corner === 'bl' ? { bottom: 'calc(50% - 140px)', left: 'calc(50% - 140px)', borderBottom: '4px solid #40e0ff', borderLeft: '4px solid #40e0ff', borderRadius: '0 0 0 4px' } : {}),
                                        ...(corner === 'br' ? { bottom: 'calc(50% - 140px)', right: 'calc(50% - 140px)', borderBottom: '4px solid #40e0ff', borderRight: '4px solid #40e0ff', borderRadius: '0 0 4px 0' } : {}),
                                    }} />
                                ))}
                                {/* Scan line */}
                                <div style={{
                                    position: 'absolute',
                                    left: 'calc(50% - 136px)',
                                    width: 272,
                                    height: 3,
                                    background: 'linear-gradient(90deg, transparent, #40e0ff, transparent)',
                                    boxShadow: '0 0 12px #40e0ff',
                                    animation: 'scanLine 1.6s ease-in-out infinite',
                                }} />
                            </div>
                        )}
                    </div>

                    {/* Result panel – ALWAYS visible so no state can hide the output */}
                    <div style={{
                        padding: '20px 24px',
                        borderRadius: '20px',
                        marginBottom: '14px',
                        backdropFilter: 'blur(12px)',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        transition: 'all 0.35s ease',
                        // Colour based on status
                        ...(status === 'success' ? {
                            background: 'rgba(6,50,36,0.95)',
                            color: '#50ffb0',
                            borderLeft: '6px solid #50ffb0',
                            borderTop: '1px solid rgba(80,255,176,0.2)',
                            borderRight: '1px solid rgba(80,255,176,0.2)',
                            borderBottom: '1px solid rgba(80,255,176,0.2)',
                            boxShadow: '0 0 30px rgba(50,220,130,0.25)',
                        } : status === 'error' ? {
                            background: 'rgba(70,10,18,0.95)',
                            color: '#ff8080',
                            borderLeft: '6px solid #ff6060',
                            borderTop: '1px solid rgba(255,100,100,0.2)',
                            borderRight: '1px solid rgba(255,100,100,0.2)',
                            borderBottom: '1px solid rgba(255,100,100,0.2)',
                            boxShadow: '0 0 30px rgba(220,50,50,0.3)',
                        } : status === 'verifying' ? {
                            background: 'rgba(4,20,44,0.9)',
                            color: '#a0e8ff',
                            borderLeft: '6px solid #40aaff',
                            borderTop: '1px solid rgba(64,200,255,0.2)',
                            borderRight: '1px solid rgba(64,200,255,0.2)',
                            borderBottom: '1px solid rgba(64,200,255,0.2)',
                        } : {
                            background: 'rgba(4,16,30,0.75)',
                            color: 'rgba(160,210,255,0.7)',
                            borderLeft: '6px solid rgba(64,224,255,0.3)',
                            borderTop: '1px solid rgba(64,224,255,0.1)',
                            borderRight: '1px solid rgba(64,224,255,0.1)',
                            borderBottom: '1px solid rgba(64,224,255,0.1)',
                        }),
                    }}>
                        {status === 'success' && <span>✅ {result}</span>}
                        {status === 'error' && <span>❌ {result}</span>}
                        {status === 'verifying' && <span>🔍 Verifying…</span>}
                        {(status === 'idle' || status === 'scanning') && (
                            <span style={{ opacity: 0.7, fontSize: '1rem' }}>
                                {running ? '🟢 Ready — point camera at ticket QR' : 'Click Start Scanning to begin'}
                            </span>
                        )}
                    </div>

                    {/* Control buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        {!running ? (
                            <button onClick={() => startCamera()} className="btn-ocean"
                                style={{ padding: '14px 40px', fontSize: '1rem' }}
                                disabled={cameras.length === 0}>
                                {cameras.length === 0 ? 'Loading camera…' : '📷 Start Scanning'}
                            </button>
                        ) : (
                            <button onClick={stopCamera}
                                style={{ padding: '12px 32px', borderRadius: '40px', border: '1px solid rgba(255,100,100,0.5)', background: 'rgba(80,16,24,0.7)', color: '#ffaaaa', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>
                                ⏹ Stop
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scanLine {
                    0%   { top: calc(50% - 136px); opacity: 0.9; }
                    50%  { top: calc(50% + 133px); opacity: 1; }
                    100% { top: calc(50% - 136px); opacity: 0.9; }
                }
                #qr-video-region video { width: 100% !important; height: auto !important; display: block; }
                #qr-video-region canvas { display: none !important; }
                #qr-video-region__header_message { display: none !important; }
            `}</style>
        </>
    );
}
