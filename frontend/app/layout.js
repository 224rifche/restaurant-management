import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "RESTAURANT SLM",
  description: "Système de gestion premium pour le restaurant SLM",
}; 

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} h-full`}>
        {children}
      </body>
    </html>
  );
}
