"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const BrazilMap=dynamic(()=>import("../../components/BrazilMap"),{ssr:false,loading:()=> <div className="map loading">Carregando mapa…</div>});
import CrmPanel from "../../components/CrmPanel";
import type { Vet } from "../../page";
const show = (v: unknown) => String(v ?? "").trim() || "Não informado";
export default function Establishment() {
  const { cnpj } = useParams<{ cnpj: string }>(),
    [v, setV] = useState<Vet | null | undefined>();
  useEffect(() => {
    fetch(`/detalhes/${cnpj.slice(0,2)}.json`)
      .then((r) => r.json())
      .then((a: Vet[]) => setV(a.find((x) => x.c === cnpj) || null));
  }, [cnpj]);
  if (v === undefined)
    return (
      <main className="detail-shell">
        <p>Carregando ficha…</p>
      </main>
    );
  if (v === null)
    return (
      <main className="detail-shell">
        <Link href="/">← Voltar</Link>
        <h1>Estabelecimento não encontrado</h1>
      </main>
    );
  const fields = (items: [string, unknown][]) =>
    items.map(([k, val]) => (
      <div className="field" key={k}>
        <span>{k}</span>
        <strong>{show(val)}</strong>
      </div>
    ));
  return (
    <main className="detail-shell">
      <Link className="back" href="/">
        ← Voltar ao dashboard
      </Link>
      <header className="detail-hero">
        <div>
          <span className="eyebrow">Ficha completa do estabelecimento</span>
          <h1>{v.f || v.r}</h1>
          <p>
            {v.r} · CNPJ {v.c}
          </p>
        </div>
        <div>
          <span className={`badge p-${v.p.toLowerCase()}`}>
            Prioridade {v.p}
          </span>
          <strong className="big-score">{v.s}</strong>
          <small>score combinado</small>
        </div>
      </header>
      <section className="quick-actions">
        {v.t&&<a href={`tel:${v.t}`}>Ligar</a>}
        {v.t&&<a href={`https://wa.me/55${v.t.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">WhatsApp</a>}
        {v.e&&<a href={`mailto:${v.e}`}>Enviar e-mail</a>}
        {v.web&&<a href={v.web.startsWith("http")?v.web:`https://${v.web}`} target="_blank" rel="noreferrer">Abrir site</a>}
        <button onClick={()=>navigator.clipboard.writeText(v.c)}>Copiar CNPJ</button>
      </section>
      <CrmPanel cnpj={v.c}/>
      <section className="detail-grid">
        <article>
          <h2>Contato e endereço</h2>
          {fields([
            ["Telefone 1", v.t],
            ["Telefone 2", v.t2],
            ["E-mail", v.e],
            ["Telefone complementar OSM", v.ot],
            ["Site identificado", v.web],
            ["Endereço", v.a],
            ["Bairro", v.b],
            ["Município / UF", `${v.m} / ${v.u}`],
          ])}
        </article>
        <article>
          <h2>Cadastro empresarial</h2>
          {fields([
            ["Matriz ou filial", v.mf],
            ["Data de abertura", v.dt],
            ["Idade", v.id ? `${v.id} anos` : ""],
            ["Porte", v.po],
            ["Capital social", v.cap],
            ["Natureza jurídica", v.nj],
            ["Simples Nacional", v.sim],
            ["MEI", v.mei],
            ["Unidades veterinárias", v.un],
            ["Quantidade de sócios", v.qs],
          ])}
        </article>
        <article>
          <h2>Perfil comercial pet</h2>
          {fields([
            ["Segmento provável", v.g],
            ["Classificação", v.k],
            ["Confiança", v.conf],
            ["Score do lead", v.sl],
            ["Score territorial", v.st],
            ["Contactabilidade", v.cont],
            ["Completude cadastral", v.comp ? `${v.comp}%` : ""],
            ["Próxima ação", v.x],
            ["Evidências pet", v.rp],
          ])}
        </article>
        <article>
          <h2>Mercado local</h2>
          {fields([
            ["Região", v.reg],
            ["Código IBGE", v.ibge],
            ["População municipal", v.pop ? v.pop.toLocaleString("pt-BR") : ""],
            [
              "Densidade vet pet",
              v.den ? `${v.den} por 100 mil habitantes` : "",
            ],
            ["Precisão da localização", v.q],
            ["Confiança geográfica", v.gconf],
            ["Fonte geográfica", v.gsrc],
            ["Latitude", v.lat],
            ["Longitude", v.lon],
          ])}
        </article>
      </section>
      <section className="map-card">
        <div className="section-title">
          <div>
            <span>Localização</span>
            <h2>
              {v.m}, {v.u}
            </h2>
          </div>
        </div>
        <BrazilMap data={[v]} detail />
        <p className="map-note">
          Localização aproximada no centroide municipal, não no endereço exato
          do estabelecimento.
        </p>
      </section>
      <section className="wide-card">
        <h2>Atividades e proveniência</h2>
        {fields([
          ["CNAE principal", "7500-1/00 — Atividades veterinárias"],
          ["CNAEs secundários", v.cn],
          ["Fonte", v.src],
          ["Atualização", v.upd],
        ])}
      </section>
      <footer>
        WiNS Hub Vet · Ficha baseada em dados públicos gratuitos da RFB e do
        IBGE
      </footer>
    </main>
  );
}
