# Registro de continuidade — WiNS Hub Vet

Última atualização: 19 de julho de 2026.

## 1. Objetivo

Construir uma base comercial nacional exclusivamente voltada a clínicas, consultórios, hospitais e serviços veterinários para animais de companhia. O ponto de partida foi o CNAE principal `7500-1/00`, removendo ou reduzindo a prioridade de reprodução animal, pecuária, laboratórios e atividades não pet.

## 2. Base e resultados atuais

| Indicador | Valor |
|---|---:|
| Estabelecimentos ativos extraídos da RFB | 44.226 |
| Classificados como pet provável | 11.671 |
| Rural/não pet | 1.270 |
| Indeterminados na base ampla | 31.285 |
| CNPJs publicados no dashboard | 11.671 |
| CNPJs duplicados publicados | 0 |
| Endereços ou POIs com coordenada individual | 833 |
| Endereços confirmados no OSM | 335 |
| POIs veterinários compatíveis | 498 |
| Fallback municipal/bairro | 10.838 |
| Sites adicionais encontrados no OSM | 66 |
| Telefones complementares encontrados no OSM | 194 |

Arquivos mestre locais relevantes, fora do repositório do frontend:

- `base_mestre_veterinarios_pet.csv` — base ampla classificada;
- `base_mestre_pet_enriquecida_gratuita.csv` — base pet com RFB e IBGE;
- `base_mestre_pet_geocodificada.csv` — base pet com precisão e fonte geográfica;
- `veterinarios_localizacao.csv` — município e bairro normalizados.

## 3. Fontes

- Receita Federal: cadastro empresarial, situação, endereço, contatos, porte, capital, abertura, natureza, Simples/MEI, CNAEs e quadro societário agregado;
- IBGE: município, região, população, código e centroides municipais;
- OpenStreetMap/Geofabrik: POIs veterinários, endereços, coordenadas, sites e telefones públicos.

O CRMV não está presente na base de CNPJ da Receita Federal. Dados de responsáveis técnicos ou registros profissionais exigem fontes próprias dos conselhos e regras específicas de acesso.

## 4. Pipeline

1. Extração de CNPJs ativos com CNAE `7500100`.
2. Classificação pet/rural/indeterminada por regras auditáveis.
3. Enriquecimento gratuito com tabelas RFB e IBGE.
4. Deduplicação por CNPJ e normalização UTF-8/NFC.
5. Processamento local do extrato brasileiro `.osm.pbf`.
6. Pareamento conservador por POI, nome, distância, CEP, número e logradouro.
7. Geração de `public/veterinarios.json` compacto e 87 fragmentos em `public/detalhes/`.
8. Build e publicação privada no Sites.

Regra geográfica: nunca apresentar um ponto como exato sem evidência. Os níveis atuais são `endereço confirmado`, `POI veterinário compatível` e `centroide municipal`. Quando um bairro é selecionado, fallbacks podem usar o centro aproximado do bairro apenas para acompanhar o filtro.

## 5. Dashboard

Filtros disponíveis:

- Estado, município e bairro;
- zona da cidade de São Paulo;
- prioridade comercial;
- precisão geográfica;
- nome, razão social ou CNPJ;
- raio de 1, 3, 5, 10 ou 25 km.

Recursos do mapa:

- clusters nacionais;
- abertura de estabelecimentos sobrepostos;
- mapa de calor;
- cores por precisão;
- reenquadramento conforme filtros;
- popup com acesso à ficha individual.

Cada ficha apresenta contatos, endereço, cadastro empresarial, perfil comercial, indicadores territoriais, precisão geográfica, fontes e ações rápidas.

## 6. CRM

O CRM usa Cloudflare D1, binding `DB`, tabela `crm` e migração Drizzle versionada. Campos:

- etapa;
- responsável;
- observações;
- próximo contato;
- já contatado;
- data de atualização.

Rotas: `GET /api/crm/:cnpj` e `PUT /api/crm/:cnpj`.

## 7. Desempenho

- índice inicial reduzido de aproximadamente 9,7 MB para 4,2 MB antes da compressão;
- fichas divididas em 87 arquivos, com cerca de 111 KB em média;
- MapLibre carregado dinamicamente e após a interface principal;
- cache persistente da base compacta em IndexedDB;
- atualização do cache em segundo plano;
- busca com valor adiado para manter a digitação responsiva;
- tabela paginada em 50 registros;
- seções fora da tela usam renderização econômica.

Ao alterar o formato do índice, incremente a constante `KEY` em `app/lib/vetCache.ts` para invalidar caches antigos.

## 8. Estrutura técnica

- `app/page.tsx` — dashboard e filtros;
- `app/components/BrazilMap.tsx` — pontos, clusters, calor e mapa;
- `app/estabelecimentos/[cnpj]/page.tsx` — ficha individual;
- `app/components/CrmPanel.tsx` — interface do CRM;
- `app/api/crm/[cnpj]/route.ts` — API persistente;
- `db/schema.ts` e `drizzle/` — banco e migrações;
- `pipeline/geocode_from_osm.py` — cruzamento geográfico local;
- `pipeline/build_pet_warehouse.py` — warehouse e validações;
- `public/veterinarios.json` — índice compacto;
- `public/detalhes/` — fichas fragmentadas.

## 9. Publicação e GitHub

- Repositório: https://github.com/Willahc/wins-hub-vet-dashboard
- Branch principal: `main`
- Projeto Sites: definido em `.openai/hosting.json`
- URL privada: https://wins-hub-vet-dashboard.williamvnvn.chatgpt.site

Mudanças relevantes foram incorporadas por PRs, incluindo mapa e fichas, zonas, geocodificação OSM, CRM, inteligência territorial e otimizações de desempenho.

## 10. Limitações conhecidas

- A maior parte dos registros ainda depende de fallback geográfico.
- Ausência de site, rede social, horário ou especialidade não significa que a empresa não possua o dado; significa apenas que ele não foi encontrado nas fontes gratuitas usadas.
- Classificação pet e scores são orientativos para prospecção, não certificações regulatórias.
- Zonas de São Paulo dependem do bairro informado e mantêm `Não classificada` para casos ambíguos.
- O extrato OSM local ocupa cerca de 1,9 GB e não deve ser versionado no GitHub.

## 11. Próxima manutenção recomendada

1. Atualizar bases RFB e IBGE.
2. Baixar novo `brazil-latest.osm.pbf` da Geofabrik.
3. Reextrair candidatos OSM e executar `pipeline/geocode_from_osm.py`.
4. Gerar novamente o dashboard com `../preparar_dashboard.py`.
5. Conferir totais, CNPJs únicos e distribuição de precisão.
6. Incrementar a chave do cache se o schema do JSON mudar.
7. Executar `npm run build` antes da publicação.

## 12. Princípios preservados

- somente fontes gratuitas no enriquecimento atual;
- foco em cães, gatos e outros animais de companhia;
- CNPJ como chave única;
- UTF-8 e acentuação preservados;
- precisão e proveniência explícitas;
- nenhuma coordenada exata inventada;
- dados pessoais desnecessários não são exibidos no frontend.
