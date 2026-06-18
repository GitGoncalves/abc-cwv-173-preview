#!/usr/bin/env node
/* =========================================================================
   ABC-152 — Gerador de SRI dos partials (header.html / footer.html)
   Calcula sha384 (base64) de cada partial e injeta no bloco marcado
   ABC_SRI_PARTIALS dentro de shared/app.js.

   USO (rode da pasta site/ ou de qualquer lugar):
     node shared/_sri-partials.mjs

   QUANDO RODAR: sempre que header.html ou footer.html mudarem, ANTES de
   publicar. Sem isso, app.js carrega os partials sem integrity (degrada com
   segurança) — mas a proteção SRI só fica ativa com os hashes atualizados.

   Premissa de segurança: SRI dos partials é o segundo anel do same-origin
   já documentado em app.js (injeção via innerHTML). Defense-in-depth.
   ========================================================================= */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url)); // .../site/shared
const APP_JS = join(HERE, 'app.js');

// chave (relativa, igual à usada em app.js) -> arquivo no disco
const PARTIALS = {
  'shared/header.html': join(HERE, 'header.html'),
  'shared/footer.html': join(HERE, 'footer.html'),
};

function sri(file) {
  const buf = readFileSync(file);
  return 'sha384-' + createHash('sha384').update(buf).digest('base64');
}

const entries = Object.entries(PARTIALS).map(([key, file]) => {
  const hash = sri(file);
  console.log(`  ${key}  ->  ${hash}`);
  return `    '${key}': '${hash}'`;
});

const block =
  `  // >>> ABC_SRI_PARTIALS (gerado — não editar)\n` +
  `  const PARTIAL_SRI = {\n` +
  entries.join(',\n') + `\n` +
  `  };\n` +
  `  // <<< ABC_SRI_PARTIALS`;

const src = readFileSync(APP_JS, 'utf8');
const re = /  \/\/ >>> ABC_SRI_PARTIALS[\s\S]*?  \/\/ <<< ABC_SRI_PARTIALS/;
if (!re.test(src)) {
  console.error('ERRO: bloco ABC_SRI_PARTIALS não encontrado em app.js — abortando.');
  process.exit(1);
}
const out = src.replace(re, block);
if (out === src) {
  console.log('SRI já estava atualizado (sem mudanças).');
} else {
  writeFileSync(APP_JS, out);
  console.log('OK: bloco ABC_SRI_PARTIALS atualizado em shared/app.js');
}
