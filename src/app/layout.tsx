import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from '@/contexts/AuthContext';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'WiringApp — Wire Harness Design',
  description: 'Design, document, and share wire harness assemblies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
          <Notifications />
          <AuthProvider>{children}</AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
