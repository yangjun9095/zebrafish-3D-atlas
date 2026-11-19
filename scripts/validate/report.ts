import type { Finding, Level } from './types.ts'

export type Report = {
  findings: Finding[]
  error: (code: string, file: string, id: string, message: string) => void
  warn: (code: string, file: string, id: string, message: string) => void
  count: (level: Level) => number
}

/** Collects findings in the order the rules produce them. */
export function createReport(): Report {
  const findings: Finding[] = []
  const add = (level: Level) => (code: string, file: string, id: string, message: string) => {
    findings.push({ level, code, file, id, message })
  }
  return {
    findings,
    error: add('E'),
    warn: add('W'),
    count: (level) => findings.filter((f) => f.level === level).length,
  }
}

/** Formats one finding as `<code> <file>:<id>: <text>` (spec 3.8). */
export function formatFinding(f: Finding): string {
  const where = f.id ? `${f.file}:${f.id}` : f.file
  return `${f.code} ${where}: ${f.message}`
}

/** Shortest decimal form of a number for messages. */
export function num(n: number): string {
  return Number.isFinite(n) ? String(Number(n.toFixed(4))) : String(n)
}
