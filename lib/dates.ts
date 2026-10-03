// Datas de lançamento (receitas/despesas) são datas de calendário, sem hora.
// Elas são armazenadas como meia-noite UTC (ex.: 2026-06-10T00:00:00.000Z) e
// todo cálculo/exibição sobre elas deve ser feito em UTC, nunca no fuso local.

export const APP_TIME_ZONE = "America/Sao_Paulo";

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** "yyyy-MM-dd" usando o calendário local do ambiente (navegador). */
export function toLocalISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "yyyy-MM-dd" de hoje no fuso informado (padrão: fuso da aplicação). */
export function todayISODate(timeZone = APP_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

/** Converte "yyyy-MM-dd" para meia-noite UTC daquele dia. */
export function parseISODate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Último milissegundo (UTC) do dia "yyyy-MM-dd". */
export function endOfISODate(value: string) {
  return new Date(parseISODate(value).getTime() + DAY_MS - 1);
}

/** Soma meses em UTC, limitando ao último dia do mês (31/01 + 1 = 28/02). */
export function addMonthsUTC(date: Date, amount: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + amount;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
}

/** Intervalo [primeiro dia 00:00, último dia 23:59:59.999] em UTC do mês de `date` (+ offset). */
export function monthRangeUTC(date: Date, monthOffset = 0) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + monthOffset;
  return {
    from: new Date(Date.UTC(year, month, 1)),
    to: new Date(Date.UTC(year, month + 1, 1) - 1)
  };
}

/** Hoje (fuso da aplicação) como meia-noite UTC. */
export function todayUTC() {
  return parseISODate(todayISODate());
}

/** Formata data de calendário (dd/MM/yyyy) sem deslocamento de fuso. */
export function formatDateOnly(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}
