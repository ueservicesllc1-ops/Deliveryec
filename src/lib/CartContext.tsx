'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  category?: string;
  description?: string;
}

interface CartContextType {
  cart: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addToCart: (item: CartItem, restaurant: { id: string, name: string }) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('deliveryy_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCart(parsed.cart || []);
        setRestaurantId(parsed.restaurantId || null);
        setRestaurantName(parsed.restaurantName || null);
      } catch (e) { console.error('Error parsing cart', e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('deliveryy_cart', JSON.stringify({ cart, restaurantId, restaurantName }));
  }, [cart, restaurantId, restaurantName]);

  const addToCart = (item: CartItem, restaurant: { id: string, name: string }) => {
    // If adding from a different restaurant, clear previous cart? 
    // Usually yes in food apps.
    if (restaurantId && restaurantId !== restaurant.id) {
       if (!confirm("Your cart from another restaurant will be cleared. Continue?")) return;
       setCart([{ ...item, qty: 1 }]);
       setRestaurantId(restaurant.id);
       setRestaurantName(restaurant.name);
       return;
    }

    setRestaurantId(restaurant.id);
    setRestaurantName(restaurant.name);
    
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.qty > 1) {
        return prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i);
      }
      const newCart = prev.filter(i => i.id !== itemId);
      if (newCart.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    setRestaurantId(null);
    setRestaurantName(null);
  };

  const cartCount = cart.reduce((acc, current) => acc + current.qty, 0);
  const subtotal = cart.reduce((acc, current) => acc + (current.price * current.qty), 0);

  return (
    <CartContext.Provider value={{ cart, restaurantId, restaurantName, addToCart, removeFromCart, clearCart, cartCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
