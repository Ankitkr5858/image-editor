import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Professional Image Editor - Advanced Text Overlay Tool',
  description: 'A professional desktop image editing application for creating stunning text overlays on PNG images. Features 20+ Google Fonts, custom font upload, advanced layer management, multi-select, curved text, text shadows, undo/redo, and pixel-perfect PNG export.',
  keywords: 'image editor, text overlay, PNG editor, design tool, graphics editor, curved text, text shadows, professional design',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}