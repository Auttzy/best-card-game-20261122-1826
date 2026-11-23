// Ember Duel's hand-in program (Node 22, standard library only). The game is
// plain static files under game/ and its screenshots under screenshots/; this
// program copies both beside it into the output directory and writes
// dossier.json, the summary the judge reads, with the vendored make.fun
// library. It runs twice in the grader and both runs must write the same
// bytes, so it does nothing time- or order-dependent: plain copies and one
// deterministic dossier build.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output; with the
// variable unset it writes to /output, exactly as the grader expects.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (from the kit's gate): only text_max_bytes shapes
// the dossier's bytes; the others refuse an entry the scorer would refuse —
// more than 4 screenshots or one over 256 KiB; more than 993 files in game/
// or 48 MiB of game files in all, or a path under game/ over 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Fail loudly instead of handing in a half-written output: the game shell
// and the dossier must both be in place before this program reports success.
if (!existsSync(join(out, 'game', 'index.html'))) throw new Error('game/index.html missing from output');
if (!existsSync(join(out, 'dossier.json'))) throw new Error('dossier.json missing from output');
console.log(`Ember Duel handed in: game/ + screenshots/ + dossier.json in ${out}`);
