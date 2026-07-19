"""Cruza a base pet com POIs veterinários do extrato local do OpenStreetMap."""
import csv, math, re, unicodedata
from pathlib import Path
import duckdb
from rapidfuzz.fuzz import token_set_ratio

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/"base_mestre_pet_enriquecida_gratuita.csv"
OUTPUT=ROOT/"base_mestre_pet_geocodificada.csv"
OSM=ROOT/"data/osm"

def norm(value):
    value=unicodedata.normalize("NFD",value or "").encode("ascii","ignore").decode().upper()
    value=re.sub(r"\b(LTDA|ME|EPP|EIRELI|CLINICA|CONSULTORIO|HOSPITAL|VETERINARIA|VETERINARIO|VET|PET)\b"," ",value)
    return re.sub(r"[^A-Z0-9]+"," ",value).strip()

def haversine(a,b,c,d):
    p1,p2=math.radians(a),math.radians(c);dp=math.radians(c-a);dl=math.radians(d-b)
    x=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 6371*2*math.asin(math.sqrt(x))

def address_parts(value):
    cep_match=re.search(r"\bCEP\s*(\d{8})",value or "");cep=cep_match.group(1) if cep_match else ""
    first=(value or "").split(",",1)[0];num_match=re.search(r"\b(\d+[A-Z]?)\s*$",first);number=num_match.group(1) if num_match else ""
    return norm(re.sub(r"\s+\d+[A-Z]?\s*$","",first)),norm(number),cep

def main():
    con=duckdb.connect();pois=[]
    for file in [OSM/"veterinary_nodes.parquet",OSM/"veterinary_way_centroids.parquet"]:
        result=con.execute("select * from read_parquet(?)",[str(file)]);cols=[x[0] for x in result.description]
        pois.extend(dict(zip(cols,r)) for r in result.fetchall())
    with SOURCE.open(encoding="utf-8-sig",newline="") as f:
        reader=csv.DictReader(f);rows=list(reader);headers=reader.fieldnames or []
    lat_col=next(x for x in headers if x.startswith("latitude municipal"));lon_col=next(x for x in headers if x.startswith("longitude municipal"));addr_col=next(x for x in headers if x.startswith("endere"))
    proposals=[]
    for i,row in enumerate(rows):
        lat=float(row[lat_col] or 0);lon=float(row[lon_col] or 0);street,num,cep=address_parts(row[addr_col]);names=[norm(row.get("nome fantasia","")),norm(row.get("razão social",""))]
        for j,p in enumerate(pois):
            dist=haversine(lat,lon,float(p["lat"]),float(p["lon"]))
            if dist>60:continue
            pname=norm(" ".join(filter(None,[p.get("poi_name"),p.get("poi_operator")])))
            name=max((token_set_ratio(n,pname) for n in names if n and pname),default=0);pstreet=norm(p.get("street") or "");sratio=token_set_ratio(street,pstreet) if street and pstreet else 0
            pcep=re.sub(r"\D","",p.get("postcode") or "");cep_eq=bool(cep and pcep and cep==pcep);pnum=norm(p.get("housenumber") or "");num_eq=bool(num and pnum and num==pnum)
            score=name*.55+sratio*.2+(18 if cep_eq else 0)+(10 if num_eq else 0)+max(0,7-dist/8)
            accepted=(name>=78 and dist<=35) or (cep_eq and num_eq and sratio>=55) or (cep_eq and name>=58)
            if accepted:proposals.append((score,i,j,name,sratio,dist,cep_eq,num_eq))
    used_rows=set();used_pois=set();matches={}
    for score,i,j,*rest in sorted(proposals,reverse=True):
        if i in used_rows or j in used_pois:continue
        used_rows.add(i);used_pois.add(j);matches[i]=(score,j,*rest)
    addresses=[]
    for address_file in [OSM/"target_address_nodes.parquet",OSM/"target_address_way_centroids.parquet"]:
        address_result=con.execute("select * from read_parquet(?)",[str(address_file)]);address_cols=[x[0] for x in address_result.description]
        addresses.extend(dict(zip(address_cols,r)) for r in address_result.fetchall())
    by_cep={}
    for address in addresses:
        key=re.sub(r"\D","",address.get("postcode") or "");by_cep.setdefault(key,[]).append(address)
    address_matches={}
    for i,row in enumerate(rows):
        if i in matches:continue
        street,num,cep=address_parts(row[addr_col]);best=None
        for address in by_cep.get(cep,[]):
            if not num or norm(address.get("housenumber") or "")!=num:continue
            similarity=token_set_ratio(street,norm(address.get("street") or ""))
            if similarity>=72 and (best is None or similarity>best[0]):best=(similarity,address)
        if best:address_matches[i]=best
    extra=["latitude estabelecimento","longitude estabelecimento","precisão geográfica","confiança geográfica","fonte geográfica","id OSM"]
    with OUTPUT.open("w",encoding="utf-8-sig",newline="") as f:
        writer=csv.DictWriter(f,fieldnames=headers+extra);writer.writeheader()
        for i,row in enumerate(rows):
            if i in matches:
                score,j,name,sratio,dist,cep_eq,num_eq=matches[i];p=pois[j];precision="endereço confirmado" if cep_eq and num_eq else "POI veterinário compatível"
                row.update({extra[0]:p["lat"],extra[1]:p["lon"],extra[2]:precision,extra[3]:round(score,1),extra[4]:"OpenStreetMap/Geofabrik",extra[5]:p["id"]})
            elif i in address_matches:
                similarity,p=address_matches[i]
                row.update({extra[0]:p["lat"],extra[1]:p["lon"],extra[2]:"endereço confirmado",extra[3]:round(85+similarity*.15,1),extra[4]:"OpenStreetMap/Geofabrik",extra[5]:p["id"]})
            else:row.update({extra[0]:row[lat_col],extra[1]:row[lon_col],extra[2]:"centroide municipal",extra[3]:0,extra[4]:"IBGE",extra[5]:""})
            writer.writerow(row)
    located=len(matches)+len(address_matches)
    print(f"registros={len(rows)} poi={len(matches)} endereco={len(address_matches)} localizados={located} fallback={len(rows)-located} saida={OUTPUT}")

if __name__=="__main__":main()
