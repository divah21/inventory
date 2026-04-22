import './globals.css';
import { AuthProvider } from '@/lib/auth';
import AuthGate from '@/components/AuthGate';
import { themeBootScript } from '@/lib/theme';

export const metadata = {
  title: 'Interplumb Inventory',
  description: 'Dynamic inventory management for projects and warehouses.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
