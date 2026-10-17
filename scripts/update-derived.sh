#!/usr/bin/env bash
# Depois de incluir um mês novo (cubo em data/cubes e data/origin-cubes + data/manifest.json),
# regenera tudo o que deriva dos dados, confere e prepara a publicação.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/build-history.py          # histórico de 10 anos (data/history)
python3 scripts/build-population.py       # população por UF/município (muda só com nova estimativa do IBGE)
node tests/lib/data-baseline.cjs --update # registra a nova impressão digital dos dados
python3 scripts/build.py                  # reembute os módulos
bash scripts/test.sh                      # todos os testes
bash scripts/build-dist.sh                # dist/ para o Cloudflare
echo "Pronto. Revise o que mudou (git status), faça commit e push para main: o Cloudflare publica sozinho."
