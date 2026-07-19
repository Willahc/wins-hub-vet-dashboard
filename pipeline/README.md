# Pipeline open source WiNS Hub Vet

Primeira camada reproduzível do enriquecimento gratuito.

## Componentes

- `build_pet_warehouse.py`: converte o CSV mestre para DuckDB e Parquet/ZSTD e bloqueia CNPJ duplicado, inválido, UF inválida ou registros não pet.
- `collect_osm_veterinary.py`: consulta o Overpass por um município de cada vez, com identificação, cache em arquivo e sem varredura agressiva.
- `requirements.txt`: dependências abertas previstas para DuckDB, Splink e Great Expectations.

## Uso

```powershell
python -m pip install -r pipeline/requirements.txt
python pipeline/build_pet_warehouse.py --input ..\base_mestre_pet_enriquecida_gratuita.csv --output-dir warehouse
python pipeline/collect_osm_veterinary.py --municipio Campinas --uf "São Paulo" --output warehouse/osm/campinas.json
```

Os resultados em `warehouse/` são derivados e não devem ser versionados. O próximo estágio cruza OSM e RFB com Splink, sempre preservando fonte, data e confiança.
