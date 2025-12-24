'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

export function AuthBackground() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth springs for the "magnetic" effect
    const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Normalize to -0.5 to 0.5 range
            mouseX.set(e.clientX / window.innerWidth - 0.5);
            mouseY.set(e.clientY / window.innerHeight - 0.5);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    // Transform values to move blobs slightly based on mouse
    const blob1X = useTransform(springX, (v) => v * 100);
    const blob1Y = useTransform(springY, (v) => v * 100);

    const blob2X = useTransform(springX, (v) => v * -150);
    const blob2Y = useTransform(springY, (v) => v * -120);

    const blob3X = useTransform(springX, (v) => v * 80);
    const blob3Y = useTransform(springY, (v) => v * -80);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-200">
            {/* Animated Glow Orbs with Cursor Following */}
            <motion.div
                style={{ x: blob1X, y: blob1Y }}
                animate={{
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full bg-sky-500/40 blur-[130px]"
            />
            <motion.div
                style={{ x: blob2X, y: blob2Y }}
                animate={{
                    scale: [1, 1.3, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                className="absolute top-[10%] -right-[5%] h-[500px] w-[500px] rounded-full bg-violet-600/30 blur-[120px]"
            />
            <motion.div
                style={{ x: blob3X, y: blob3Y }}
                animate={{
                    scale: [1.2, 1, 1.2],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5
                }}
                className="absolute -bottom-[10%] left-[10%] h-[700px] w-[700px] rounded-full bg-indigo-500/30 blur-[160px]"
            />

            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                    backgroundImage: `linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)`,
                    backgroundSize: '80px 80px',
                    maskImage: 'radial-gradient(ellipse at center, black, transparent 90%)'
                }}
            />

            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />
        </div>
    );
}
