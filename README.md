# WiNS Hub Vet

Plataforma privada de inteligência comercial para estabelecimentos veterinários pet do Brasil, construída a partir de dados públicos e gratuitos.

- Dashboard: https://wins-hub-vet-dashboard.williamvnvn.chatgpt.site
- Base publicada: 11.671 CNPJs pet classificados e únicos
- Fontes principais: Receita Federal, IBGE e OpenStreetMap/Geofabrik
- Frontend: React 19, Next/Vinext e MapLibre GL
- Persistência comercial: Cloudflare D1

## Funcionalidades

- filtros por Estado, município, bairro, zona de São Paulo, prioridade e precisão geográfica;
- zonas Leste, Norte, Sul, Oeste e Centro da cidade de São Paulo;
- mapa nacional com clusters, calor, zoom sincronizado e consulta por raio;
- páginas individuais por estabelecimento;
- ranking territorial por bairro e município;
- classificação pet e priorização comercial;
- ações de telefone, WhatsApp, e-mail, site e cópia do CNPJ;
- CRM persistente com etapa, responsável, próximo contato e observações;
- cache IndexedDB, carregamento adiado do mapa e fichas divididas em fragmentos.

## Atualização local

```bash
npm install
python pipeline/geocode_from_osm.py
python ../preparar_dashboard.py
npm run db:generate
npm run build
```

O pipeline geográfico requer os arquivos derivados do extrato brasileiro do OpenStreetMap em `../data/osm/`. Dados grandes, arquivos locais e credenciais não devem ser enviados ao GitHub.

Consulte [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) para arquitetura, números, decisões, limitações e procedimentos completos.
