import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title:"Dashboard WiNS Hub Vet", description:"Inteligência comercial do mercado veterinário brasileiro" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="pt-BR"><head><meta charSet="utf-8"/></head><body>{children}</body></html> }
