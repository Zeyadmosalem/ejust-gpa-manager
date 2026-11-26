import type { Metadata, Viewport } from "next";
import { Nav } from "@/components/Nav";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
const FEEDBACK_URL = "https://github.com/Zeyadmosalem/ejust-gpa-manager/issues/new/choose";

export const metadata: Metadata = {
  title: "E-JUST GPA Manager",
  description: "Track your marks, GPA and degree progress at E-JUST. Free, and your data stays on your device.",
  manifest: `${base}/manifest.webmanifest`,
  icons: {
    icon: [{ url: `${base}/icon.svg`, type: "image/svg+xml" }, { url: `${base}/icon-192.png`, sizes: "192x192" }],
    apple: `${base}/apple-touch-icon.png`,
  },
  appleWebApp: { capable: true, title: "E-JUST GPA", statusBarStyle: "default" },
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
          Handbook (2024).{" "}
          <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
            Report a problem or suggest a feature
          </a>
          .
        </footer>
        <RegisterSW />
      </body>
    </html>
  );
}
