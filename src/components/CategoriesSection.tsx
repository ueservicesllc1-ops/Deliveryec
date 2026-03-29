'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

const categories = [
  { name: 'Pizza', img: '/cat-pizza.png' },
  { name: 'Hamburguesas', img: '/cat-burger.png' },
  { name: 'Sushi', img: '/cat-sushi.png' },
  { name: 'Pollo Frito', img: '/cat-pollo.png' },
  { name: 'Mexicana', img: '/cat-tacos.png' },
  { name: 'Postres', img: '/cat-postres.png' },
];

export default function CategoriesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="section-white section-pad">
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Explora por <span className="gradient-text">Categorías</span>
          </h2>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--orange)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            Ver todas <ArrowRight size={14} />
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${categories.length}, 1fr)`, gap: '16px', overflowX: 'auto' }}>
          {categories.map((cat, i) => (
            <motion.a key={i} href="#" className="cat-card"
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, delay: i * 0.07 }}>
              <div className="cat-circle">
                <Image src={cat.img} alt={cat.name} width={90} height={90} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span className="cat-name">{cat.name}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
