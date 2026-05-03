// Animated Background - Subtle Moving Purple Glow Blobs
// Add this script to your templates for animated background

(function () {
    'use strict';

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'animated-bg';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.opacity = '0.6';
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    let width, height;

    // Blob configuration
    const blobs = [];
    const blobCount = 5;

    class Blob {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.radius = Math.random() * 200 + 150;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.hue = Math.random() * 30 + 250; // Purple/blue range
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < -this.radius || this.x > width + this.radius) {
                this.vx *= -1;
            }
            if (this.y < -this.radius || this.y > height + this.radius) {
                this.vy *= -1;
            }
        }

        draw() {
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.radius
            );

            gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, 0.15)`);
            gradient.addColorStop(0.5, `hsla(${this.hue}, 70%, 50%, 0.08)`);
            gradient.addColorStop(1, `hsla(${this.hue}, 70%, 40%, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function init() {
        resize();
        blobs.length = 0;

        for (let i = 0; i < blobCount; i++) {
            blobs.push(new Blob());
        }
    }

    function animate() {
        // Clear canvas
        ctx.fillStyle = 'rgba(17, 24, 39, 0.05)';
        ctx.fillRect(0, 0, width, height);

        // Update and draw blobs
        blobs.forEach(blob => {
            blob.update();
            blob.draw();
        });

        requestAnimationFrame(animate);
    }

    // Initialize and start animation
    window.addEventListener('resize', resize);

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
            animate();
        });
    } else {
        init();
        animate();
    }

    // Add fade-in class to body
    document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('fade-in');

        // Add fade-in to cards with delay
        const cards = document.querySelectorAll('.card, .stat-card, .action-card, .form-section, .preview-section');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s forwards`;
        });
    });
})();
