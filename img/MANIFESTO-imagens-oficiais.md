# Manifesto de Imagens Oficiais — Produtos Hytera & Motorola Solutions

Imagens comerciais oficiais dos fabricantes (fundo branco/limpo, sem pessoas), baixadas
para uso da ABC Mais Telecom (revenda autorizada). Coletadas em 2026-06-17.

Origem: CDN oficial Hytera (`img-cdn.hytera.com`) e Motorola Solutions (`motorolasolutions.com/content/dam`).
Todas validadas com `file` (imagem real) e `stat` (> 5 KB). Nenhuma com pessoas / lifestyle / marca-d'água de terceiros.

---

## Câmera corporal (body camera) — `camera-corporal/`

| Arquivo | Produto | Fonte oficial (URL de origem) | Formato | Bytes |
|---|---|---|---|---|
| `hytera-vm580d.webp` | Hytera VM580D (bodycam 4G ultrafina) | https://img-cdn.hytera.com/iwov-resources/hytera/02_products/2_main_image/en_vm580d_main.png_n.webp | WebP | 48.478 |
| `hytera-vm68x.webp` | Hytera VM68X (bodycam + RSM) | https://img-cdn.hytera.com/iwov-resources/hytera/02_products/2_main_image/LTE_BWC_Emergency/en_VM68X_main.png_n.webp | WebP | 30.798 |
| `hytera-sc580.webp` | Hytera SC580 (smart body camera) | https://img-cdn.hytera.com/iwov-resources/hytera/02_products/2_main_image/sc580_main.png_n.webp | WebP 800x800 | 12.006 |

---

## Repetidor de sinal (repeater) — `repetidor/`

| Arquivo | Produto | Fonte oficial (URL de origem) | Formato | Bytes |
|---|---|---|---|---|
| `hytera-hr65x.webp` | Hytera HR65X (repetidor DMR compacto) | https://img-cdn.hytera.com/iwov-resources/hytera/02_products/2_main_image/en_HR65X_main.png_n.webp | WebP | 22.580 |
| `motorola-slr8000-front-angle.jpg` | Motorola MOTOTRBO SLR 8000 (vista frontal angulada) | https://www.motorolasolutions.com/content/dam/msi/images/products/mototrbo/systems/infrastructure/slr8000/slr8000_front_angle_324x324.jpg | JPEG 324x324 | 24.010 |
| `motorola-slr8000-front.jpg` | Motorola MOTOTRBO SLR 8000 (vista frontal) | https://www.motorolasolutions.com/content/dam/msi/images/products/mototrbo/systems/infrastructure/slr8000/slr8000_front_324x324.jpg | JPEG 324x324 | 17.388 |
| `motorola-slr5500-front-angle.jpg` | Motorola MOTOTRBO SLR 5500 | https://www.motorolasolutions.com/content/dam/msi/images/products/mototrbo/slr5000-series/product-slr5000-front-angle-abaco-darrell-ryan-0609.jpg | JPEG 600x600 | 52.709 |
| `motorola-slr1000-front-angle.jpg` | Motorola MOTOTRBO SLR 1000 | https://www.motorolasolutions.com/content/dam/msi/images/products/mototrbo/slr-1000/slr_1000_repeater_white_front_top_angled_800x800.jpg | JPEG 704x704 | 22.716 |

---

## Acessórios — `acessorios/`

| Arquivo | Produto | Fonte oficial (URL de origem) | Formato | Bytes |
|---|---|---|---|---|
| `hytera-esw01-earpiece.webp` | Hytera ESW01 (fone/earpiece sem fio) | https://img-cdn.hytera.com/iwov-resources/hytera/02_products/6_accessories/3_audio/main_image/ESW01_POA107_main.png_n.webp | WebP | 53.536 |
| `motorola-battery-pmnn4409.jpg` | Motorola IMPRES PMNN4409 (bateria Li-Ion 2150mAh) | https://www.motorolasolutions.com/content/dam/msi/images/business/products/accessories/p_-_r/pmmn4409/pmnn4409_impress_slim_li-ion_2150mah_lg.jpg | JPEG 324x324 | 37.154 |
| `motorola-charger-nntn8275.jpg` | Motorola NNTN8275 (carregador de unidade única) | https://www.motorolasolutions.com/content/dam/msi/images/business/products/accessories/_images/_mototrbo/_static/bulkupload/bulkupload/nntn8275.jpg | JPEG 324x324 | 5.901 |
| `motorola-charger-mdhtn3000.jpg` | Motorola MDHTN3000 (carregador) | https://www.motorolasolutions.com/content/dam/msi/images/business/b2b_internationalization_patni/pcr_accessories/chargers/mdhtn3000/mdhtn3000_lg_pl-pl.jpg | JPEG 324x324 | 23.495 |
| `motorola-multicharger-wpln4212.jpg` | Motorola WPLN4212 (carregador multi-unidade) | https://www.motorolasolutions.com/content/dam/msi/images/products/two-way-radios/two-way-accessories/WPLN4212_NoDevices_324x324.jpg | JPEG 324x324 | 28.885 |

---

## Infraestrutura / DMR Tier III — `infraestrutura-dmr/`

| Arquivo | Produto | Fonte oficial (URL de origem) | Formato | Bytes |
|---|---|---|---|---|
| `hytera-e-pole-100.webp` | Hytera E-pole100 (infraestrutura wireless fixa, voz narrowband) | https://img-cdn.hytera.com/iwov-resources/hytera/02_products/2_main_image/LTE_BWC_Emergency/en_E_pole_100_main.png_n.webp | WebP | 38.682 |

---

## Não encontrado / não baixado (honestidade)

- **Hytera VM550D**: a câmera específica VM550D não tem imagem servida no padrão de URL do CDN
  (`en_vm550d_main.png_n.webp` e variantes retornaram HTTP 500). Cobertura de body camera Hytera
  garantida via VM580D, VM68X e SC580. Pendente: obter a página oficial atual do VM550D para extrair a URL correta.
- **Motorola VB400 / V300 / Si500** (body cameras): as URLs de imagem do dispositivo isolado retornadas
  pela página oficial do VB400 estavam quebradas (host malformado / HTTP 404 — `content.dam.msi/...`).
  A página é renderizada dinamicamente e não expôs a URL real do CDN. Pendente: capturar a URL via
  navegador renderizado (a página atual não entrega no HTML estático).
- **Hytera RD965** (repeater): EOL (descontinuado); não baixado. Substituído pelo HR65X (sucessor, baixado).
- **Antena (genérica das marcas)**: não baixada — as páginas de antena Motorola não expuseram URL de
  imagem limpa no HTML estático nesta coleta. Pendente.

> Reposição/ampliação: usar WebFetch nas páginas oficiais pedindo as URLs do CDN, depois `curl` + validação
> `file`/`stat`. Para VB400 e antenas, será necessária renderização de página (browser headless) para obter a URL real.
