import type { Metadata, Viewport } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-JUST GPA Manager",
  description: "Track your marks, GPA and degree progress at E-JUST. Free, and your data stays on your device.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#111418" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="container">{children}</main>
        <footer className="container footer">
          Unofficial tool. Your official transcript is the source of truth. Grading rules follow the CSIT Student
          Handbook (2024).
        </footer>
      </body>
    </html>
  );
}
