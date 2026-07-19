"use client";

import { useEffect, useMemo, useState } from "react";

type Vet = { c:string;r:string;f:string;u:string;m:string;b:string;p:string;s:number;sl:number;st:number;pop:number;den:string;sim:string;id:string;un:number;mf:string;nj:string;cn:string;qs:number;dt:string;lat:string;lon:string;g:string;k:string;t:string;e:string;a:string;x:string };
const PAGE_SIZE = 50;
const priorityRank: Record<string, number> = { A:0, B:1, C:2, REVISAR:3, EXCLUIR:4 };

function unique(values: string[]) {
  const canonical = new Map<string,string>();
  values.filter(Boolean).forEach(value => {
    const clean=value.normalize("NFC").replace(/\s+/g," ").trim();
    const key=clean.toLocaleUpperCase("pt-BR");
    if(!canonical.has(key)) canonical.set(key,clean);
  });
  return [...canonical.values()].sort((a,b)=>a.localeCompare(b,"pt-BR"));
}

export default function Dashboard() {
  const [data,setData] = useState<Vet[]>([]);
  const [loading,setLoading] = useState(true);
  const [uf,setUf] = useState("");
  const [municipio,setMunicipio] = useState("");
  const [bairro,setBairro] = useState("");
  const [prioridade,setPrioridade] = useState("");
  const [classificacao,setClassificacao] = useState("");
  const [busca,setBusca] = useState("");
  const [page,setPage] = useState(1);

  useEffect(()=>{ fetch("/veterinarios.json").then(r=>r.json()).then((rows:Vet[])=>{
    const byCnpj=new Map<string,Vet>();
    rows.forEach(row=>byCnpj.set(row.c,row));
    setData([...byCnpj.values()]);
  }).finally(()=>setLoading(false)); },[]);
  const ufs = useMemo(()=>unique(data.map(v=>v.u)),[data]);
  const municipios = useMemo(()=>unique(data.filter(v=>!uf||v.u===uf).map(v=>v.m)),[data,uf]);
  const bairros = useMemo(()=>unique(data.filter(v=>(!uf||v.u===uf)&&(!municipio||v.m===municipio)).map(v=>v.b)),[data,uf,municipio]);

  const filtered = useMemo(()=>{
    const q=busca.trim().toLocaleUpperCase("pt-BR");
    return data.filter(v=>(!uf||v.u===uf)&&(!municipio||v.m===municipio)&&(!bairro||v.b===bairro)&&(!prioridade||v.p===prioridade)&&(!classificacao||v.k===classificacao)&&(!q||`${v.r} ${v.f} ${v.c}`.toLocaleUpperCase("pt-BR").includes(q)))
      .sort((a,b)=>(priorityRank[a.p]-priorityRank[b.p])||(b.s-a.s)||a.r.localeCompare(b.r,"pt-BR"));
  },[data,uf,municipio,bairro,prioridade,classificacao,busca]);

  useEffect(()=>setPage(1),[uf,municipio,bairro,prioridade,classificacao,busca]);
  const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const rows=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const pet=filtered.filter(v=>v.k==="pet provável").length;
  const priorityA=filtered.filter(v=>v.p==="A").length;
  const contactable=filtered.filter(v=>v.t||v.e).length;
  const avg=filtered.length?Math.round(filtered.reduce((n,v)=>n+v.s,0)/filtered.length):0;
  const byUf=useMemo(()=>Object.entries(filtered.reduce<Record<string,number>>((a,v)=>{a[v.u]=(a[v.u]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]).slice(0,8),[filtered]);
  const maxUf=byUf[0]?.[1]||1;

  function clear(){setUf("");setMunicipio("");setBairro("");setPrioridade("");setClassificacao("");setBusca("");}

  return <main>
    <header className="hero">
      <div><span className="eyebrow">WiNS Hub Vet · Inteligência comercial pet</span><h1>Mapa nacional de clínicas para animais de companhia</h1><p>Explore estabelecimentos para cães, gatos e outros pets, priorizados por qualidade comercial e oportunidade territorial.</p></div>
      <div className="status"><span className="pulse"/> Base RFB consolidada</div>
    </header>

    <section className="filters" aria-label="Filtros">
      <label>Estado<select value={uf} onChange={e=>{setUf(e.target.value);setMunicipio("");setBairro("")}}><option value="">Todos os estados</option>{ufs.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Município<select value={municipio} onChange={e=>{setMunicipio(e.target.value);setBairro("")}}><option value="">Todos os municípios</option>{municipios.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Bairro<select value={bairro} onChange={e=>setBairro(e.target.value)}><option value="">Todos os bairros</option>{bairros.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Prioridade<select value={prioridade} onChange={e=>setPrioridade(e.target.value)}><option value="">Todas</option>{["A","B","C","REVISAR","EXCLUIR"].map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Classificação<select value={classificacao} onChange={e=>setClassificacao(e.target.value)}><option value="">Todas</option>{unique(data.map(v=>v.k)).map(x=><option key={x}>{x}</option>)}</select></label>
      <label className="search">Buscar<input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Razão social, fantasia ou CNPJ"/></label>
      <button className="clear" onClick={clear}>Limpar filtros</button>
    </section>

    {loading ? <section className="loading">Carregando 44 mil estabelecimentos…</section> : <>
      <section className="kpis">
        <article><span>Resultados</span><strong>{filtered.length.toLocaleString("pt-BR")}</strong><small>estabelecimentos filtrados</small></article>
        <article><span>Mercado pet</span><strong>{pet.toLocaleString("pt-BR")}</strong><small>cães, gatos e animais de companhia</small></article>
        <article><span>Prioridade A</span><strong>{priorityA.toLocaleString("pt-BR")}</strong><small>leads para ação imediata</small></article>
        <article><span>Com contato</span><strong>{contactable.toLocaleString("pt-BR")}</strong><small>telefone ou e-mail disponível</small></article>
        <article><span>Score médio</span><strong>{avg}</strong><small>de 100 pontos</small></article>
      </section>

      <section className="insights">
        <article className="chart"><div className="section-title"><div><span>Distribuição</span><h2>Top estados na seleção</h2></div></div>{byUf.map(([state,n])=><div className="bar-row" key={state}><b>{state}</b><div className="bar-track"><i style={{width:`${n/maxUf*100}%`}}/></div><span>{n.toLocaleString("pt-BR")}</span></div>)}</article>
        <article className="spotlight"><span>Oportunidade atual</span><strong>{priorityA.toLocaleString("pt-BR")}</strong><p>leads prioridade A dentro dos filtros selecionados.</p><div className="meter"><i style={{width:`${filtered.length?priorityA/filtered.length*100:0}%`}}/></div><small>Ordenamos a tabela por prioridade e score automaticamente.</small></article>
      </section>

      <section className="table-card">
        <div className="section-title"><div><span>Base detalhada</span><h2>Estabelecimentos</h2></div><div className="count">{((page-1)*PAGE_SIZE+1).toLocaleString("pt-BR")}–{Math.min(page*PAGE_SIZE,filtered.length).toLocaleString("pt-BR")} de {filtered.length.toLocaleString("pt-BR")}</div></div>
        <div className="table-wrap"><table><thead><tr><th>Prioridade</th><th>Score</th><th>Estabelecimento</th><th>Localização</th><th>Mercado local</th><th>Contato</th><th>Perfil pet</th><th>RFB e IBGE</th></tr></thead><tbody>{rows.map(v=><tr key={v.c}><td><span className={`badge p-${v.p.toLowerCase()}`}>{v.p}</span></td><td><span className="score">{v.s}</span><small>Lead {v.sl} · Território {v.st}</small></td><td><strong>{v.f||v.r}</strong><small>{v.f&&v.r}</small><code>{v.c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}</code></td><td><strong>{v.m} · {v.u}</strong><small>{v.b||"Bairro não informado"}</small><small>{v.a}</small></td><td>{v.pop?v.pop.toLocaleString("pt-BR")+" habitantes":"—"}<small>{v.den?`${v.den} estabelecimentos/100 mil hab.`:"Sem indicador"}</small></td><td>{v.t||"—"}<small>{v.e||"Sem e-mail"}</small></td><td>{v.g}<small>{v.sim==="sim"?"Simples Nacional":""}{v.id?` · ${v.id} anos`:""}{v.un>1?` · ${v.un} unidades`:""}</small></td><td><strong>{v.mf} · {v.qs} sócio(s)</strong><small>Abertura: {v.dt||"não informada"}</small><small>Natureza: {v.nj||"—"}</small><small title={v.cn}>CNAEs secundários: {v.cn||"—"}</small>{v.lat&&<a href={`https://www.openstreetmap.org/?mlat=${v.lat}&mlon=${v.lon}#map=12/${v.lat}/${v.lon}`} target="_blank" rel="noreferrer">Ver município no mapa ↗</a>}</td></tr>)}</tbody></table></div>
        <nav className="pagination"><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Anterior</button><span>Página {page} de {totalPages}</span><button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Próxima →</button></nav>
      </section>
    </>}
    <footer>WiNS Hub Vet · Fontes gratuitas: Receita Federal e IBGE · Classificação orientativa para prospecção pet</footer>
  </main>
}
