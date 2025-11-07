export const metadata = {
  title: 'Pink Diary',
  description: 'Period tracker - Next.js version',
};

import './globals.css';
import Navbar from '../components/Navbar';
import { Plus_Jakarta_Sans } from 'next/font/google';
import ThemeProvider from '../components/ThemeProvider';
import { Toaster } from 'sonner';

const font = Plus_Jakarta_Sans({ subsets: ['latin'] });
import dynamic from 'next/dynamic';
const HealthChatbot = dynamic(() => import('../components/HealthChatbot'), { ssr: false });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="min-h-full">
      <body className={`${font.className} min-h-full bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 text-gray-900 dark:bg-gradient-to-br dark:from-zinc-950 dark:via-zinc-900 dark:to-neutral-900 dark:text-zinc-100` }>
        <ThemeProvider>
          <Navbar />
          <main className="container-wide py-6">
            {children}
          </main>
          <Toaster richColors position="top-right" />
          {/* Floating menstrual health chatbot */}
          <HealthChatbot />
        </ThemeProvider>
      </body>
    </html>
  );
}
