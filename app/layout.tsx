import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FlashForge — Spaced Repetition Flashcards',
  description:
    'Study smarter with FlashForge. Create flashcard decks and let the SM-2 spaced repetition engine schedule exactly what you need to review today.',
  keywords: 'flashcards, spaced repetition, study, SM-2, learning',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" />
      </head>
      <body>
        <nav className="navbar">
          <div className="container navbar-inner">
            <a href="/" className="navbar-logo">
              <span className="logo-icon">⚡</span>
              Flash<span>Forge</span>
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
