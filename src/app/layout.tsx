import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { CartProvider } from "@/lib/CartContext";

export const metadata: Metadata = {
  title: "Delivery.ec — Tu comida favorita, rápida y segura",
  description: "La app de delivery más rápida de Ecuador. Pide tu comida favorita en minutos. Rastreo en tiempo real, pagos seguros y +2,500 restaurantes.",
  keywords: "delivery Ecuador, comida a domicilio, pedidos online, Quito, Guayaquil",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
