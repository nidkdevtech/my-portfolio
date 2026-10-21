// src/components/NavBar.tsx: sticky top nav with scroll progress, plus the toast
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { profile } from '../data';

const ACCENT = '#3abf00';
const links = [
  { id: 'hero', label: 'Home' },
  { id: 'timeline', label: 'Journey' },
  { id: 'projects', label: 'Projects' },
  { id: 'gateway', label: 'Playground' },
  { id: 'about', label: 'About' },
];

export function NavBar() {
  const [active, setActive] = useState('hero');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      let current = 'hero';
      links.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight / 2) current = id;
      });
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur border-b border-gray-900">
      <nav className="mx-auto max-w-7xl h-12 px-4 sm:px-8 flex items-center justify-between" aria-label="Main">
        <button onClick={() => go('hero')} className="font-display font-extrabold text-sm tracking-wide" style={{ color: ACCENT }} aria-label="Back to top">
          {profile.initials}<span className="text-gray-500">/&gt;</span>
        </button>
        <ul className="flex items-center gap-1 sm:gap-2">
          {links.map(({ id, label }) => (
            <li key={id}>
              <button onClick={() => go(id)} aria-current={active === id ? 'true' : undefined}
                className="px-2 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-mono transition-colors hover:text-white"
                style={{ color: active === id ? ACCENT : '#9ca3af', background: active === id ? 'rgba(58,191,0,0.10)' : 'transparent' }}>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="h-px origin-left" style={{ background: ACCENT, transform: `scaleX(${progress})` }} />
    </header>
  );
}

export function Toast({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full bg-gray-900 border text-sm text-white shadow-lg"
          style={{ borderColor: ACCENT }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
