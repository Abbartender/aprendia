import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aprend·IA — Tu tarea, clara y simple.",
  description:
    "Plataforma educativa con IA para niños de primaria. Subí la foto de la tarea y Aprend·IA la convierte en una pizarra lista para aprender.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
