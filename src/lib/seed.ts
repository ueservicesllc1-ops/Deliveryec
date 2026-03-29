import { db } from './firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const sampleRestaurants = [
  {
    id: 'burger-paradise',
    name: 'Burger Paradise',
    category: 'Burgers',
    rating: 4.8,
    reviews: 520,
    time: '20-30 min',
    delivery: 1.50,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
    ownerId: 'demo-owner-1',
    isOpen: true,
    menu: [
      {
        id: 'm1',
        name: 'Paradise Special',
        description: 'Carne premium 200g, cheddar doble, tocino, cebolla caramelizada y salsa secreta.',
        price: 12.50,
        image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=800&auto=format&fit=crop',
        category: 'Populares',
      },
      {
        id: 'm2',
        name: 'Cheese Burger',
        description: 'Versión clásica con lechuga, tomate, pepinillos y queso fundido.',
        price: 8.99,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
        category: 'Individuales',
      }
    ]
  },
  {
    id: 'neo-tokyo-sushi',
    name: 'Neo Tokyo Sushi',
    category: 'Sushi',
    rating: 4.9,
    reviews: 310,
    time: '35-45 min',
    delivery: 0,
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=800&auto=format&fit=crop',
    isOpen: true,
    menu: [
      {
        id: 's1',
        name: 'Dragon Roll',
        description: 'Langostino tempura, aguacate, masago y salsa anguila.',
        price: 14.00,
        image: 'https://images.unsplash.com/photo-1617196034738-26c5f7c977ce?q=80&w=800&auto=format&fit=crop',
        category: 'Populares',
      }
    ]
  }
];

export const seedDatabase = async () => {
  for (const res of sampleRestaurants) {
    await setDoc(doc(db, 'restaurants', res.id), res);
    console.log(`Seeded restaurant: ${res.name}`);
  }
};
