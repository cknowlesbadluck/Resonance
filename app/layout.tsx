import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Resonance", description: "Integration and orchestration plane" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
