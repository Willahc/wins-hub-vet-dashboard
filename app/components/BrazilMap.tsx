"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapVet = { c:string; r:string; f:string; u:string; m:string; b:string; p:string; s:number; lat:string; lon:string; q?:string };

type Area={bairro?:string;municipio?:string;uf?:string};
export default function BrazilMap({data,detail=false,area,mode="points"}:{data:MapVet[];detail?:boolean;area?:Area;mode?:"points"|"heat"}) {
  const node=useRef<HTMLDivElement>(null);
  const map=useRef<MapLibreMap|null>(null);
  const latest=useRef(data);
  const areaCenter=useRef<[number,number]|null>(null);
  latest.current=data;

  function focus(rows:MapVet[]) {
    const m=map.current;
    const points=rows.filter(v=>v.lat&&v.lon).map(v=>v.q==="centroide municipal"&&areaCenter.current?areaCenter.current:[Number(v.lon),Number(v.lat)] as [number,number]);
    if(!m||!points.length) return;
    const samePlace=points.length===1||points.every(p=>p[0]===points[0][0]&&p[1]===points[0][1]);
    if(samePlace) { m.easeTo({center:points[0],zoom:detail?11:10,duration:650}); return; }
    const bounds=points.reduce((b,p)=>b.extend(p),new maplibregl.LngLatBounds(points[0],points[0]));
    m.fitBounds(bounds,{padding:55,maxZoom:9,duration:650});
  }

  function update(rows:MapVet[]) {
    const m=map.current;
    if(!m||!m.isStyleLoaded()) return;
    const geo:GeoJSON.FeatureCollection={type:"FeatureCollection",features:rows.filter(v=>areaCenter.current||(v.lat&&v.lon)).map(v=>({type:"Feature",geometry:{type:"Point",coordinates:v.q==="centroide municipal"&&areaCenter.current?areaCenter.current:[Number(v.lon),Number(v.lat)]},properties:{cnpj:v.c,name:v.f||v.r,city:v.m,uf:v.u,score:v.s,priority:v.p,precision:v.q||"centroide municipal"}}))};
    const source=m.getSource("vets") as maplibregl.GeoJSONSource|undefined;
    if(source) { source.setData(geo);(m.getSource("heat-vets") as maplibregl.GeoJSONSource|undefined)?.setData(geo);focus(rows); return; }
    m.addSource("vets",{type:"geojson",data:geo,cluster:!detail,clusterMaxZoom:11,clusterRadius:42});
    m.addSource("heat-vets",{type:"geojson",data:geo});
    m.addLayer({id:"heat",type:"heatmap",source:"heat-vets",paint:{"heatmap-weight":["interpolate",["linear"],["get","score"],0,0.2,100,1],"heatmap-intensity":["interpolate",["linear"],["zoom"],2,0.7,12,2.8],"heatmap-radius":["interpolate",["linear"],["zoom"],2,10,12,32],"heatmap-opacity":0.82},layout:{visibility:mode==="heat"?"visible":"none"}});
    if(!detail) {
      m.addLayer({id:"clusters",type:"circle",source:"vets",filter:["has","point_count"],paint:{"circle-color":["step",["get","point_count"],"#66a978",80,"#1d7954",500,"#123d2f"],"circle-radius":["step",["get","point_count"],17,80,23,500,31],"circle-stroke-width":2,"circle-stroke-color":"#fff"}});
      m.addLayer({id:"cluster-count",type:"symbol",source:"vets",filter:["has","point_count"],layout:{"text-field":["get","point_count_abbreviated"],"text-size":12},paint:{"text-color":"#fff"}});
    }
    m.addLayer({id:"points",type:"circle",source:"vets",filter:["!",["has","point_count"]],paint:{"circle-color":["match",["get","precision"],"endereço confirmado","#1f9d65","POI veterinário compatível","#3288d1","#d2a52a"],"circle-radius":detail?10:6,"circle-stroke-width":2,"circle-stroke-color":"#123d2f"}});
    focus(rows);
  }

  useEffect(()=>{
    if(!node.current||map.current) return;
    const first=latest.current[0];
    map.current=new maplibregl.Map({container:node.current,center:detail?[Number(first?.lon)||-52,Number(first?.lat)||-14]:[-52,-14],zoom:detail?11:3.2,style:{version:8,sources:{osm:{type:"raster",tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],tileSize:256,attribution:"© OpenStreetMap contributors"}},layers:[{id:"osm",type:"raster",source:"osm"}]}});
    map.current.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-right");
    map.current.on("load",()=>update(latest.current));
    map.current.on("click","clusters",async e=>{const f=map.current?.queryRenderedFeatures(e.point,{layers:["clusters"]})[0];if(!f)return;const source=map.current?.getSource("vets") as maplibregl.GeoJSONSource,id=f.properties?.cluster_id;const zoom=await source.getClusterExpansionZoom(id);if(zoom<=11){map.current?.easeTo({center:(f.geometry as GeoJSON.Point).coordinates as [number,number],zoom});return}const leaves=await source.getClusterLeaves(id,20,0);const links=leaves.map(x=>`<a href="/estabelecimentos/${x.properties?.cnpj}">${safe(x.properties?.name)}</a>`).join("");new maplibregl.Popup({maxWidth:"340px"}).setLngLat((f.geometry as GeoJSON.Point).coordinates as [number,number]).setHTML(`<div class="map-popup"><b>Estabelecimentos neste ponto</b>${links}</div>`).addTo(map.current!)});
    map.current.on("click","points",e=>{const f=e.features?.[0];if(!f)return;const p=f.properties||{};new maplibregl.Popup().setLngLat((f.geometry as GeoJSON.Point).coordinates as [number,number]).setHTML(`<div class="map-popup"><b>${safe(p.name)}</b><span>${safe(p.city)} · ${safe(p.uf)}</span><span>${safe(p.precision)}</span><span>Score ${p.score} · Prioridade ${safe(p.priority)}</span><a href="/estabelecimentos/${p.cnpj}">Abrir ficha completa →</a></div>`).addTo(map.current!)});
    return()=>{map.current?.remove();map.current=null};
  },[detail]);

  useEffect(()=>update(data),[data]);
  useEffect(()=>{const m=map.current;if(!m||!m.getLayer("heat"))return;m.setLayoutProperty("heat","visibility",mode==="heat"?"visible":"none");for(const id of["clusters","cluster-count","points"])if(m.getLayer(id))m.setLayoutProperty(id,"visibility",mode==="points"?"visible":"none")},[mode]);
  useEffect(()=>{
    if(detail||!area?.bairro){areaCenter.current=null;update(data);return}
    const query=[area.bairro,area.municipio,area.uf,"Brasil"].filter(Boolean).join(", ");
    const key=`wins-vet-geocode:${query.toLocaleLowerCase("pt-BR")}`;
    const cached=localStorage.getItem(key);
    if(cached){areaCenter.current=JSON.parse(cached);update(data);return}
    const controller=new AbortController();
    fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`,{signal:controller.signal})
      .then(r=>r.ok?r.json():[])
      .then((results:{lat:string;lon:string}[])=>{if(!results[0])return;const center:[number,number]=[Number(results[0].lon),Number(results[0].lat)];areaCenter.current=center;localStorage.setItem(key,JSON.stringify(center));update(data)})
      .catch(()=>undefined);
    return()=>controller.abort();
  },[area?.bairro,area?.municipio,area?.uf,detail]);
  return <div ref={node} className={detail?"map map-detail":"map"} aria-label="Mapa interativo"/>;
}

function safe(v:unknown){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]!))}
