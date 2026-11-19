// Turns the zod JIT off for the whole page (SEC-03).
//
// zod compiles a fast parser for each object shape with `new Function`. The deployed
// Content-Security-Policy (public/_headers, vercel.json) sets `script-src 'self'` with no
// `unsafe-eval`, so that call throws. zod catches the throw and falls back to its interpreter,
// but the browser still records the attempt as a script-src violation and reports it. Setting
// `jitless` before the first schema is built removes both the probe and the compile.
//
// The switch also costs nothing where there is no CSP. Each shape is parsed a handful of times
// in one session, so the compile never pays for itself. Measured over the six atlas files and
// vocabulary.json on node 22: 107 ms with the JIT, 65 ms without (three runs each,
// scripts read through src/data/index.ts).
//
// zod reads the flag when a schema is constructed, and src/core/urlState.ts builds its schema at
// module scope. src/main.tsx therefore imports this module before every other module of the app.
// tests/unit/zodConfig.test.ts holds that order.
import { z } from 'zod'

z.config({ jitless: true })
