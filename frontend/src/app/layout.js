import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "HostelFixIT — Hostel Maintenance System",
  description:
    "HostelFixIT helps students file maintenance complaints, wardens manage them, and workers resolve them — all in one place.",
  keywords: ["hostel", "maintenance", "complaints", "facility management"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#0a0d14" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1f2d45",
              color: "#f1f5f9",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              fontSize: "0.9rem",
            },
            success: {
              iconTheme: { primary: "#4ade80", secondary: "#0a0d14" },
            },
            error: {
              iconTheme: { primary: "#f87171", secondary: "#0a0d14" },
            },
          }}
        />
      </body>
    </html>
  );
}
