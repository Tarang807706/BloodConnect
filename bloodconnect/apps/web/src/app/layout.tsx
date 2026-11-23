import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../providers/AuthProvider';
import { Navbar } from '../components/shared/Navbar';
import { Footer } from '../components/shared/Footer';

export const metadata: Metadata = {
  title: 'BloodConnect | Emergency Blood Coordination Platform',
  description: 'AI-Assisted Emergency Blood Coordination and Voluntary Donor Mobilization System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
