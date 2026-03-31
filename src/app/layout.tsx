import type { Metadata, Viewport } from "next";
export const maxDuration = 60; // Configura Vercel para permitir até 60s em todas as rotas filhas
export const dynamic = "force-dynamic"; // Impede cache compartilhado entre sessões de médicos diferentes
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Anamnese Pro - Gestão Médica",
  description: "Sistema médico SaaS com anamnese IA, gestão de pacientes e templates flexíveis.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Anamnese",
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-primary/30 selection:text-slate-900 bg-[#F8FAFC] text-slate-800 min-h-screen relative overflow-x-hidden`}
      >
        {/* Noise Texture for Depth */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat"></div>
        
        {/* Subtle Ambient Glows */}
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>

        <NextIntlClientProvider messages={messages}>
          <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            {children}

          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
