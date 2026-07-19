"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BrazilMap from "./components/BrazilMap";
import { saoPauloZone } from "./lib/saoPauloZones";
export type Vet = {
  c: string;
  r: string;
  f: string;
  u: string;
  m: string;
  b: string;
  p: string;
  s: number;
  sl: number;
  st: number;
  pop: number;
  den: string;
  sim: string;
  id: string;
  un: number;
  mf: string;
  nj: string;
  cn: string;
  qs: number;
  dt: string;
  lat: string;
  lon: string;
  g: string;
  k: string;
  t: string;
  e: string;
  a: string;
  x: string;
  t2: string;
  mei: string;
  po: string;
  cap: string;
  reg: string;
  ibge: string;
  cont: string;
  comp: string;
  conf: string;
  rp: string;
  src: string;
  upd: string;
  q: string;
  gconf: string;
  gsrc: string;
  web: string;
  ot: string;
};
const N = 50,
  rank: Record<string, number> = { A: 0, B: 1, C: 2, REVISAR: 3, EXCLUIR: 4 },
  unique = (a: string[]) =>
    [
      ...new Map(
        a.filter(Boolean).map((x) => {
          const v = x.normalize("NFC").replace(/\s+/g, " ").trim();
          return [v.toLocaleUpperCase("pt-BR"), v];
        }),
      ).values(),
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));
export default function Dashboard() {
  const [data, setData] = useState<Vet[]>([]),
    [loading, setLoading] = useState(true),
    [uf, setUf] = useState(""),
    [municipio, setMunicipio] = useState(""),
    [bairro, setBairro] = useState(""),
    [zona, setZona] = useState(""),
    [prioridade, setPrioridade] = useState(""),
    [precisao, setPrecisao] = useState(""),
    [mapMode, setMapMode] = useState<"points"|"heat">("points"),
    [origin, setOrigin] = useState<Vet|null>(null),
    [radius, setRadius] = useState(10),
    [busca, setBusca] = useState(""),
    [page, setPage] = useState(1);
  useEffect(() => {
    fetch("/veterinarios.json")
      .then((r) => r.json())
      .then((a: Vet[]) =>
        setData([...new Map(a.map((v) => [v.c, v])).values()]),
      )
      .finally(() => setLoading(false));
  }, []);
  const municipios = useMemo(
      () => unique(data.filter((v) => !uf || v.u === uf).map((v) => v.m)),
      [data, uf],
    ),
    bairros = useMemo(
      () =>
        unique(
          data
            .filter(
              (v) => (!uf || v.u === uf) && (!municipio || v.m === municipio),
            )
            .map((v) => v.b),
        ),
      [data, uf, municipio],
    );
  const filtered = useMemo(() => {
    const q = busca.trim().toLocaleUpperCase("pt-BR");
    return data
      .filter(
        (v) =>
          (!uf || v.u === uf) &&
          (!municipio || v.m === municipio) &&
          (!bairro || v.b === bairro) &&
          (!zona || saoPauloZone(v.m, v.b) === zona) &&
          (!prioridade || v.p === prioridade) &&
          (!precisao || v.q === precisao) &&
          (!origin || distanceKm(origin,v)<=radius) &&
          (!q || `${v.r} ${v.f} ${v.c}`.toLocaleUpperCase("pt-BR").includes(q)),
      )
      .sort((a, b) => rank[a.p] - rank[b.p] || b.s - a.s);
  }, [data, uf, municipio, bairro, zona, prioridade, precisao, busca, origin, radius]);
  useEffect(() => setPage(1), [uf, municipio, bairro, zona, prioridade, precisao, busca, origin, radius]);
  const rows = filtered.slice((page - 1) * N, page * N),
    pages = Math.max(1, Math.ceil(filtered.length / N)),
    priorityA = filtered.filter((v) => v.p === "A").length,
    contactable = filtered.filter((v) => v.t || v.e).length,
    avg = filtered.length
      ? Math.round(filtered.reduce((n, v) => n + v.s, 0) / filtered.length)
      : 0;
  const territories=useMemo(()=>Object.values(filtered.reduce<Record<string,{name:string;n:number;score:number;pop:number}>>((acc,v)=>{const name=`${v.b||"Sem bairro"} · ${v.m}/${v.u}`;const x=acc[name]||{name,n:0,score:0,pop:v.pop};x.n++;x.score+=v.st;acc[name]=x;return acc},{})).map(x=>({...x,score:Math.round(x.score/x.n)})).sort((a,b)=>b.score-a.score||b.pop-a.pop).slice(0,8),[filtered]);
  function clear() {
    setUf("");
    setMunicipio("");
    setBairro("");
    setZona("");
    setPrioridade("");
    setPrecisao("");setOrigin(null);
    setBusca("");
  }
  return (
    <main>
      <header className="hero">
        <div>
          <span className="eyebrow">
            WiNS Hub Vet · Inteligência comercial pet
          </span>
          <h1>Mapa nacional de clínicas para animais de companhia</h1>
          <p>
            Encontre, filtre e abra a ficha completa de cada estabelecimento
            veterinário pet.
          </p>
        </div>
        <div className="status">
          <span className="pulse" /> Base RFB + IBGE
        </div>
      </header>
      <section className="filters">
        <label>
          Estado
          <select
            value={uf}
            onChange={(e) => {
              setUf(e.target.value);
              setMunicipio("");
              setBairro("");
              setZona("");
            }}
          >
            <option value="">Todos</option>
            {unique(data.map((v) => v.u)).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Município
          <select
            value={municipio}
            onChange={(e) => {
              setMunicipio(e.target.value);
              setBairro("");
              setZona("");
            }}
          >
            <option value="">Todos</option>
            {municipios.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Zona de São Paulo
          <select value={zona} onChange={(e) => setZona(e.target.value)}>
            <option value="">Todas</option>
            {["Zona Leste", "Zona Norte", "Zona Sul", "Zona Oeste", "Centro", "Não classificada"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label>
          Bairro
          <select value={bairro} onChange={(e) => setBairro(e.target.value)}>
            <option value="">Todos</option>
            {bairros.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Prioridade
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
          >
            <option value="">Todas</option>
            {["A", "B", "C", "REVISAR"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>Precisão<select value={precisao} onChange={e=>setPrecisao(e.target.value)}><option value="">Todas</option><option>endereço confirmado</option><option>POI veterinário compatível</option><option>centroide municipal</option></select></label>
        <label className="search">
          Buscar
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome ou CNPJ"
          />
        </label>
        <button className="clear" onClick={clear}>
          Limpar
        </button>
      </section>
      {loading ? (
        <section className="loading">Carregando estabelecimentos…</section>
      ) : (
        <>
          <section className="kpis">
            <article>
              <span>Resultados</span>
              <strong>{filtered.length.toLocaleString("pt-BR")}</strong>
              <small>estabelecimentos</small>
            </article>
            <article>
              <span>Prioridade A</span>
              <strong>{priorityA.toLocaleString("pt-BR")}</strong>
              <small>ação imediata</small>
            </article>
            <article>
              <span>Com contato</span>
              <strong>{contactable.toLocaleString("pt-BR")}</strong>
              <small>telefone ou e-mail</small>
            </article>
            <article>
              <span>Score médio</span>
              <strong>{avg}</strong>
              <small>de 100 pontos</small>
            </article>
          </section>
          <section className="map-card">
            <div className="section-title">
              <div>
                <span>Distribuição nacional</span>
                <h2>Mapa dos estabelecimentos filtrados</h2>
              </div>
              <div className="count">
                {filtered.length.toLocaleString("pt-BR")} pontos
              </div>
            </div>
            <div className="map-tools"><button className={mapMode==="points"?"active":""} onClick={()=>setMapMode("points")}>Pontos</button><button className={mapMode==="heat"?"active":""} onClick={()=>setMapMode("heat")}>Mapa de calor</button>{origin&&<><span>Raio a partir de {origin.f||origin.r}</span><select value={radius} onChange={e=>setRadius(Number(e.target.value))}>{[1,3,5,10,25].map(x=><option key={x} value={x}>{x} km</option>)}</select><button onClick={()=>setOrigin(null)}>Remover raio</button></>}</div>
            <BrazilMap data={filtered} area={{ bairro, municipio, uf }} mode={mapMode}/>
            <p className="map-note">
              Os pontos usam o centroide do município. A posição exata da
              clínica só será exibida após geocodificação validada do endereço.
            </p>
          </section>
          <section className="territorial"><div className="section-title"><div><span>Inteligência territorial</span><h2>Maiores oportunidades da seleção</h2></div></div><div className="territory-grid">{territories.map((x,i)=><article key={x.name}><b>#{i+1} {x.name}</b><strong>{x.score}</strong><small>score territorial · {x.n} estabelecimento(s) · {x.pop.toLocaleString("pt-BR")} habitantes</small></article>)}</div></section>
          <section className="table-card">
            <div className="section-title">
              <div>
                <span>Base detalhada</span>
                <h2>Estabelecimentos</h2>
              </div>
              <div className="count">
                {filtered.length
                  ? `${(page - 1) * N + 1}–${Math.min(page * N, filtered.length)}`
                  : "0"}{" "}
                de {filtered.length.toLocaleString("pt-BR")}
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Prioridade</th>
                    <th>Score</th>
                    <th>Estabelecimento</th>
                    <th>Localização</th>
                    <th>Contato</th>
                    <th>Perfil</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((v) => (
                    <tr key={v.c}>
                      <td>
                        <span className={`badge p-${v.p.toLowerCase()}`}>
                          {v.p}
                        </span>
                      </td>
                      <td>
                        <span className="score">{v.s}</span>
                        <small>
                          Lead {v.sl} · Território {v.st}
                        </small>
                      </td>
                      <td>
                        <Link
                          className="name-link"
                          href={`/estabelecimentos/${v.c}`}
                        >
                          {v.f || v.r}
                        </Link>
                        <small>{v.f && v.r}</small>
                        <code>{v.c}</code>
                      </td>
                      <td>
                        <strong>
                          {v.m} · {v.u}
                        </strong>
                        <small>{v.b || "Bairro não informado"}</small>
                        <small>{v.a}</small>
                      </td>
                      <td>
                        {v.t || "—"}
                        <small>{v.e || "Sem e-mail"}</small>
                      </td>
                      <td>
                        {v.g}
                        <small>
                          {v.po} · {v.mf}
                        </small>
                      </td>
                      <td>
                        <Link
                          className="open"
                          href={`/estabelecimentos/${v.c}`}
                        >
                          Ver ficha →
                        </Link>
                        <button className="radius-button" onClick={()=>setOrigin(v)}>Buscar no raio</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </button>
              <span>
                Página {page} de {pages}
              </span>
              <button
                disabled={page === pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima →
              </button>
            </nav>
          </section>
        </>
      )}
      <footer>
        WiNS Hub Vet · Fontes gratuitas: Receita Federal e IBGE · Dados para
        inteligência comercial
      </footer>
    </main>
  );
}
function distanceKm(a:Vet,b:Vet){const p1=Number(a.lat)*Math.PI/180,p2=Number(b.lat)*Math.PI/180,dp=(Number(b.lat)-Number(a.lat))*Math.PI/180,dl=(Number(b.lon)-Number(a.lon))*Math.PI/180;const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 6371*2*Math.asin(Math.sqrt(x))}
