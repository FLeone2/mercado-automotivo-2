# Mercado Automotivo 2

Painel do mercado brasileiro de emplacamentos (automóveis + comerciais leves), publicado no Cloudflare Pages.
Esta é a versão reformulada. O repositório original (`mercado-automotivo`) segue intocado.

## Regra principal

Este repositório é a fonte do painel. **Não suba um `index.html` exportado do Codex/ChatGPT aqui:** ele apagaria as mudanças. Peça novas alterações direto neste repositório.

## Publicação

O Cloudflare Pages publica só a pasta `dist/`. Código, scripts, testes, documentação e arquivos-fonte brutos não ficam públicos.

| Configuração no Cloudflare Pages | Valor |
|---|---|
| Build command | `bash scripts/build-dist.sh` |
| Build output directory | `dist` |

Para testar localmente:

```sh
bash scripts/build-dist.sh
cd dist && python3 -m http.server 8765
```

## Tema e design system

- **Um tema só**, com três cores de destaque (Petróleo, que é o padrão, Verde oliva e Azul marinho), cada uma em claro e escuro, mais o modo **Apresentação** (escuro).
- `src/theme-registry.js`: tokens de cada cor e paleta dos gráficos (validada para daltonismo).
- `src/design-system.css`: a camada visual única (superfícies planas, navegação, controles, tipografia, movimento). É sempre a última folha de estilo.
- Fonte Geist hospedada em `assets/fonts/` (licença OFL).
- Vermelho é exclusivo da Mitsubishi; queda usa laranja.

Depois de editar esses arquivos:

```sh
python3 scripts/build-design-system.py   # sempre por último, depois de qualquer outro build-*.py
node tests/theme-registry.test.cjs
```

O script também aplica três ajustes no runtime: tema salvo inexistente volta ao padrão em vez de travar o app; exportação de imagem usa Petróleo; e as cores dos gráficos seguem a paleta (antes o runtime girava o matiz da primeira cor e gerava tons aleatórios).

## Seções novas e como reconstruir

| Área | O que mudou | Fonte | Build |
|---|---|---|---|
| Panorama | "O que mudou" em frases; KPIs no topo; sem o mapa repetido | `src/overview-insights.*` | `scripts/build.py` |
| Concorrência | "Mitsubishi no seu segmento": ranking no segmento, matriz por UF, concentração (HHI) | `src/competitive-reading.*` | `scripts/build.py` |
| Territórios | Mapa principal com zoom animado e hover leve; "Marcas no território": top 3 por estado, força da marca, espigões (mercado, Mitsubishi, rede × oportunidade) e Brasil em 3D com rotação | `src/primary-map.*`, `src/territory-brand-maps.*`, `data/geography/municipal-points.json` | `scripts/build.py` (pontos: `scripts/build-municipal-points.py`) |
| Economia (ex-Cenários) | "Contexto econômico" primeiro; análises técnicas mantidas nas subabas | `src/scenarios.js`, `src/scenario-context.css`, `src/navigation.js` | `scripts/build.py` |
| Todas | "Mais análises" visíveis por área; Explorar com todos os formatos e mapas | `src/catalog-workspace.js` | `scripts/build.py` |

### Build único

```sh
python3 scripts/build.py      # reembute todos os módulos de src/ no index.html
bash scripts/test.sh          # todos os testes Node e Python
bash scripts/build-dist.sh    # gera dist/ (o que o Cloudflare publica)
node tests/visual/run.cjs     # varredura visual: claro/escuro, desktop/celular
```

`scripts/build.py` é o único build. Ele lista cada módulo (`// BEGIN X` … `// END X`) e cada folha de estilo,
reaplica os pontos de montagem, roda a transformação das notas e, por último, o design system com os hashes de CSP.
Módulos novos entram em `MODULES`/`STYLES` dentro dele.

Os scripts antigos `build-*.py` que encadeiam outros builds se recusam a rodar (eles reembutiam versões antigas de outros módulos).
Para forçar, use `MA_LEGACY_BUILD=1`, mas prefira sempre `build.py`.

## Testes

- `bash scripts/test.sh` roda tudo. Os testes estatísticos de Economia precisam de `pip install -r scripts/requirements-scenarios.txt`.
- `tests/fixtures/data-baseline.json` guarda o SHA-256 de cada arquivo de dados: mudanças de interface não podem alterar dados.
  Ao incluir um mês novo de propósito, atualize com `node tests/lib/data-baseline.cjs --update`.
- `tests/fixtures/component-ids.json` lista as identidades de componentes usadas por links e favoritos; nenhuma pode sumir.
- `tests/visual/run.cjs` falha com erro de página ou rolagem horizontal e lista textos cortados como aviso; as capturas ficam em `tests/visual/output/`.

## Atualizar com um mês novo

1. Coloque o cubo do mês em `data/cubes/` e `data/origin-cubes/` e atualize `data/manifest.json` (mesmo processo de ingestão usado até aqui).
2. Rode `bash scripts/update-derived.sh`. Ele regenera o histórico de 10 anos, registra a nova impressão digital dos dados, reembute os módulos, roda todos os testes e gera `dist/`.
3. Faça commit e push para `main`. O GitHub roda as verificações (`.github/workflows/checks.yml`) e o Cloudflare publica.

Os dados da Economia (Banco Central, IBGE) são atualizados à parte com `python scripts/build_scenarios.py --repo .`, que precisa de internet.

## Funções novas (2026-10)

| Área | O que faz | Fonte |
|---|---|---|
| Todas | Pulso do recorte: mercado, marca em foco, participação, posição e ritmo por dia útil | `src/market-pulse.*` |
| Panorama | Perguntas rápidas e resumo de uma página em PDF | `src/market-pulse.js`, `src/export-tools.*` |
| Todas | Copiar link, Imprimir / PDF, Favoritos em qualquer área, Baixar PNG dos gráficos | `src/navigation.js`, `src/export-tools.*`, `scripts/build-mounts.json` |
| Evolução | Ritmo por dia útil, sazonalidade e meses fora do padrão | `src/history-analyses.js` |
| Concorrência | De onde veio a variação; modelo contra modelo | `src/history-analyses.js` |
| Propulsão | Eletrificação desde 2016 | `src/history-analyses.js` |
| Territórios | Emplacamentos por mil habitantes | `src/history-analyses.js`, `data/reference/population.json` |
| Economia | Selos dado oficial / análise / projeção | `src/scenarios.js` |
| Dados e metodologia | Como confiar nestes números | `src/trust-guide.*` |
| Territórios | Marca líder por município (UF, filtros do painel, volume mínimo, zoom próprio) | `src/leader-map.*`, modo `leaders` do worker |
| Territórios | Mapa de calor ao lado dos espigões | `src/territory-brand-maps.js` |
| Tema | Terra e Oliva e ouro (a partir das paletas Marrom e Verde; gráficos mantêm a paleta validada) | `src/theme-registry.js` |

`data/history/` (soma mensal dos cubos, gerada por `scripts/build-history.py`) alimenta as análises de longo prazo sem baixar 129 cubos no navegador.

## Documentação histórica

Os relatórios e manifestos dos pacotes anteriores estão em `docs/historico/`.

---

## Notas técnicas herdadas

> Os comandos `python scripts/build-*.py` citados abaixo são históricos e hoje se recusam a rodar. Use `python3 scripts/build.py` e `bash scripts/test.sh`.

Static dashboard published by the existing GitHub → Cloudflare Pages integration.
`index.html` contains the reviewed snapshot, bundled runtime and authored application.
Monthly reviewed data remain in `data/`; ranking changes do not modify those files.

## Ranking views

Ranking has Lista, Conectado and Pirâmide, with shared entity/position/volume/search controls and global multi-select filters. Connected comparison reuses the existing coverage-aware A/B calculation worker, extended to brands, models and original model groups. The BD segment pyramid remains in Explorar.

`src/ranking-views.js` and `.css` maintain the new presentation. After edits run:

```sh
python scripts/build-ranking.py
node tests/ranking.test.cjs
```

The build script embeds those sources, checks both executable scripts, and updates exact inline-script CSP hashes in `_headers`. Other authored logic and the bundled workers remain inside `index.html`; do not overwrite it from an older snapshot.

Tests use the actual August/September 2026 cubes to verify totals, ranks, denominators, Mitsubishi identity, arbitrary Top N, filters, report generation, favorites validation and proportional pyramid geometry. No test fixtures are used as dashboard data.

Before publication also verify the preview in desktop/mobile and light/dark modes, including repeated subtab changes, custom A dates, favorites restoration, report dialogs and CSV exports.

## Overview and action footers

Overview uses the shared UF filter for persistent click/keyboard selection. The map
has a separately labeled national context (same other filters, excluding UF and
municipality), while indicators, charts, reports and exports use the selected
scope. Hover/focus only shows a transient tooltip. Clear selection removes UF and
municipality explicitly; the existing municipality/dealer exploration is retained.

`FooterAction` uses the bundled React DOM portal to place existing live action
components in a common footer, without copying their query state or handlers.
Ranking retains its existing footer. Contextual CSVs keep their own source rows
and scope; dialogs remain owned by their original components.

After edits to authored logic in `index.html`, refresh script hashes and run all
regressions:

```sh
python scripts/build-ranking.py
for test in tests/*.test.cjs; do node "$test" || exit; done
```

`overview-map.test.cjs` tests actual component handlers, `overview-data.test.cjs`
checks reviewed September source totals for BA/SP and the national baseline, and
`footer-actions.test.cjs` checks footer routing without replacing action handlers.
Browser QA must still check geometry, focus, light/dark/mobile, all tab footers,
report/export dialogs and municipality/dealer navigation on the deployed preview.

## Evolution analytics

`src/evolution-views.js`, `.css` and `evolution-market-worker.js` maintain the
three Evolution subviews and benchmark aggregations. After changing them run:

```sh
python scripts/build-evolution.py
for test in tests/*.test.cjs; do node "$test" || exit; done
```

See `EVOLUTION_SOURCE_AUDIT.md` for scope/denominators, coverage semantics,
retained detailed views and outstanding browser/publication checks.

## Seven areas and Cenários

The visible top navigation has Panorama, Evolução, Concorrência, Segmentos,
Territórios, Explorar and Cenários. Dados e metodologia is always a secondary
link. All legacy leaf URL IDs and favorite schemas remain registered. BD
structure charts moved intact to Segmentos; its existing pyramid is also
available there. Legacy Explore pyramid favorites still reopen as Segmentos.

`src/navigation.js/css` owns grouped navigation and the rounded outer glass
paint. Content overflow remains visible so menus and scroll regions are not cut.

Cenários has five subtabs backed by lazy-loaded `data/scenarios/*.json`.
The module explicitly labels its fixed national package and does not pretend
that global filters recompute it. Macro charts include official units, last
complete months, lag-specific reviewed residual pairs and exploratory warnings.
The municipal atlas supports real official state-local polygon extrusion,
per-1,000 or volume height, Mitsubishi-share color, rotation and a 2D alternative.
It is a state-by-state atlas, not a stitched national geographic mesh. GDP is
2023; population is 2026; municipal registers are January–September 2026.
The 30-city legacy sample remains separate and explicitly labeled.

Forecasts are experimental and disclose failure against held-out baselines and
actual test coverage of nominal intervals. A two-factor response surface is
unavailable because no such model has been validated. Existing frozen Phase 2
analyses, selectors and export handlers remain accessible in the expandable
“Análises anteriores e cenários congelados” section.

Build and test the combined application:

```sh
python scripts/build-scenarios.py
for test in tests/*.test.cjs; do node "$test" || exit; done
python -m unittest discover -s tests -p 'test_scenarios.py' -v
```

This builder embeds Cenários, then rebuilds Evolution and navigation, preserving
ranking sources and refreshing inline CSP hashes. See `SCENARIOS_DATA.md` for
source contracts and statistical limitations. To regenerate the data in this
checkout, use `python scripts/build_scenarios.py --repo .` after obtaining its
official external inputs. Source fetch scripts require internet and NumPy.

Before publication: real-browser desktop/mobile, light/dark, all five subtab
switches, 2D/3D rotation/UF changes, focus/hover tooltips, scatter/heatmap selection,
legacy expansion, CSV/report dialogs and back/forward require rendered QA.
Automated geometry/source tests are not a claim that browser QA has happened.

## Header and territory channel mix

The SVG market identity and centered navigation live in `src/navigation.js/css`.
`MarketHeader` portals the authored controls into the existing topbar, with an
inline fallback, mounting cleanup and an explicit mobile-height override. Legacy
routes, favorites and the seven areas remain registered. The population and original `grupo_modelo` selectors
are both in `+ filtros`; there is no separate quick-model row.
Processing status is in the page footer, including Ranking.

Header regression: `node tests/header-layout.test.cjs`. Browser pixel/layout QA
is still required on desktop/mobile and light/dark themes; source/component tests
do not substitute for a rendered-browser check.

`src/territory-channels.js/css` adds the second Brazil map and UF list below the
existing territorial map. The snapshot worker supplies exact UF × channel
counts from the same accepted-row filter pipeline. The comparison explicitly
removes only `tipo_venda`, retaining all other territory filters. Unknown channel
codes stay in the denominator. Polygon area, rather than bounding-box width, is
divided proportionally; incomplete channel/month coverage suppresses shares.

After changes to the header or territory channel component, run:

```sh
python scripts/build-territory-channels.py
node tests/header-layout.test.cjs
node tests/territory-channels.test.cjs
```

This embeds the new component, then the Evolution worker, navigation and ranking
sources, and refreshes CSP hashes without modifying reviewed data. See
`TERRITORY_CHANNELS_AUDIT.md` for source codes, denominators, coverage and QA.

## Compact shared navigation update

The shell header now contains only the compact identity and seven primary areas.
One shared second row immediately before the global filters contains the active
area’s analyses. Evolution view state is owned by the dashboard; Cenários keeps
its existing saved section state. Competition and Segments retain leaf route IDs.
The Ranking format selector stays inside Ranking content, above its local controls
and A/B comparison. Global filter order and all export/report footers are preserved.

Build: `python scripts/build-scenarios.py`. Run every `tests/*.test.cjs` with Node
and `python -m unittest discover -s tests -p 'test_scenarios.py' -v`.
These checks validate component trees, state callbacks, responsive CSS contracts,
data regressions, source embedding, JavaScript syntax and CSP hashes. They do not
claim computed-layout or browser screenshot verification; rendered desktop/mobile
and theme QA remains pending because browser access is blocked in this session.
