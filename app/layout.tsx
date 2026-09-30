import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Resonance", description: "Provider-neutral integration and intelligence Nexus" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
