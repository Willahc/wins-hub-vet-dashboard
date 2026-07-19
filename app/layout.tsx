import type{Metadata}from"next";import"./globals.css";import"./enhancements.css";import"./crm.css";import"./advanced.css";import"./territorial.css";import"./performance.css";
export const metadata:Metadata={title:"WiNS Hub Vet — Mapa e inteligência comercial",description:"Estabelecimentos veterinários pet do Brasil com filtros, mapa e fichas completas."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><head><meta charSet="utf-8"/></head><body>{children}</body></html>}
