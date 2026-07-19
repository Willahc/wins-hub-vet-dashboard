"""Converte a base mestre pet em DuckDB/Parquet e executa controles de qualidade."""
import argparse
from pathlib import Path
import duckdb

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--input", type=Path, required=True)
    ap.add_argument("--output-dir", type=Path, default=Path("warehouse"))
    args=ap.parse_args(); args.output_dir.mkdir(parents=True,exist_ok=True)
    db=args.output_dir/"wins_hub_vet.duckdb"; parquet=args.output_dir/"estabelecimentos_pet.parquet"
    con=duckdb.connect(str(db))
    con.execute("CREATE OR REPLACE TABLE estabelecimentos_pet AS SELECT * FROM read_csv_auto(?, header=true, all_varchar=true, encoding='utf-8')",[str(args.input)])
    tests={
      "cnpj_unico":"SELECT count(*)-count(DISTINCT CNPJ) FROM estabelecimentos_pet",
      "cnpj_invalido":"SELECT count(*) FROM estabelecimentos_pet WHERE NOT regexp_full_match(CNPJ,'[0-9]{14}')",
      "uf_invalida":"SELECT count(*) FROM estabelecimentos_pet WHERE length(UF)<>2",
      "classificacao_nao_pet":'SELECT count(*) FROM estabelecimentos_pet WHERE "classificação pet"<>\'pet provável\'',
    }
    failed=[]
    for name,sql in tests.items():
        value=con.execute(sql).fetchone()[0]; print(f"{name}={value}")
        if value: failed.append(name)
    if failed: raise SystemExit("Falhas de qualidade: "+", ".join(failed))
    con.execute("COPY estabelecimentos_pet TO ? (FORMAT PARQUET, COMPRESSION ZSTD)",[str(parquet)])
    print(f"linhas={con.execute('SELECT count(*) FROM estabelecimentos_pet').fetchone()[0]} parquet={parquet}")

if __name__ == "__main__": main()
