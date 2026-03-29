'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import Image from 'next/image';

const restaurants = [
  { name: 'Pizza Paradise', cuisine: 'Pizza · Italiana · $$', rating: 4.8, time: '25–35 min', deliveryFrom: '$12', img: '/cat-pizza.png', free: false },
  { name: 'Burger King EC', cuisine: 'Hamburguesas · Americana · $$', rating: 4.7, time: '20–30 min', deliveryFrom: '$10', img: '/cat-burger.png', free: true },
  { name: 'Sushi Master', cuisine: 'Sushi · Japonesa · $$$', rating: 4.9, time: '30–40 min', deliveryFrom: '$15', img: '/cat-sushi.png', free: false },
  { name: 'Taco Fiesta', cuisine: 'Mexicana · Tacos · $', rating: 4.6, time: '15–25 min', deliveryFrom: '$8', img: '/cat-tacos.png', free: true },
];

export default function RestaurantsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="restaurants" ref={ref} style={{ background: 'var(--light-bg)', padding: '56px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Restaurantes <span className="gradient-text">Populares</span>
          </h2>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--orange)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            Ver todos los restaurantes <ArrowRight size={14} />
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {restaurants.map((r, i) => (
            <motion.div key={i} className="rest-card"
              initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}>

              <div className="rest-card-img">
                <Image src={r.img} alt={r.name} fill style={{ objectFit: 'cover' }} />
                <div className="badge-time">
                  <div className="dot" />
                  {r.time}
                </div>
                <div className="badge-rating">
                  <Star size={11} fill="var(--orange)" color="transparent" />
                  <span>{r.rating}</span>
                </div>
              </div>

              <div className="rest-card-body">
                <h3 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-dark)' }}>
                  {r.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{r.cuisine}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '14px' }}>
                  {r.free ? '✓ Envío gratis' : `Envío gratis desde ${r.deliveryFrom}`}
                </p>
                <button className="btn-orange" style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px', borderRadius: '8px' }}>
                  Ordenar Ahora
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
