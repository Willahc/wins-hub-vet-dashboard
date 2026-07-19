"""Coleta controlada de estabelecimentos veterinários no OpenStreetMap."""
import argparse, json, time
from pathlib import Path
import requests

ENDPOINT = "https://overpass-api.de/api/interpreter"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--municipio", required=True)
    ap.add_argument("--uf", required=True)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    query = f'''[out:json][timeout:90];
area["name"="{args.uf}"]["boundary"="administrative"]->.uf;
area["name"="{args.municipio}"]["boundary"="administrative"](area.uf)->.city;
nwr["amenity"="veterinary"](area.city);
out center tags;'''
    headers = {"User-Agent": "WiNS-Hub-Vet/1.0 (public-data research; cached)"}
    response = requests.post(ENDPOINT, data={"data": query}, headers=headers, timeout=120)
    response.raise_for_status()
    payload = response.json()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"elementos={len(payload.get('elements', []))} arquivo={args.output}")
    time.sleep(1)

if __name__ == "__main__": main()
