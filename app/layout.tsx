// filepath: app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./components/Providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ShiftSync",
  description: "Internal Scheduling App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        <Providers>
          <Toaster />
          {children}
        </Providers>
      </body>
    </html>
  );
}