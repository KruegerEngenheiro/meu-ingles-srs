// Preferencias de estudo guardadas no aparelho (localStorage).
// A principal e o limite de palavras NOVAS por dia, pra nao afogar o usuario.

const CHAVE_LIMITE = 'limite-novas-dia';
export const LIMITE_PADRAO = 20;

export function getLimiteNovas(): number {
  try {
    const v = localStorage.getItem(CHAVE_LIMITE);
    if (v !== null) {
      const n = parseInt(v, 10);
      if (!isNaN(n) && n >= 0) return n;
    }
  } catch {
    // em modo privado o localStorage pode falhar
  }
  return LIMITE_PADRAO;
}

export function setLimiteNovas(n: number): void {
  const val = Math.max(0, Math.floor(n || 0));
  try {
    localStorage.setItem(CHAVE_LIMITE, String(val));
  } catch {}
}

// Contador de palavras novas ja introduzidas HOJE (reinicia sozinho a cada dia).
function chaveHoje(agora: number = Date.now()): string {
  const d = new Date(agora);
  return `novas-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getNovasHoje(agora: number = Date.now()): number {
  try {
    const v = localStorage.getItem(chaveHoje(agora));
    if (v !== null) {
      const n = parseInt(v, 10);
      if (!isNaN(n)) return n;
    }
  } catch {}
  return 0;
}

export function incNovasHoje(agora: number = Date.now()): void {
  try {
    localStorage.setItem(chaveHoje(agora), String(getNovasHoje(agora) + 1));
  } catch {}
}

// Quantas palavras novas ainda cabem hoje.
export function novasRestantesHoje(agora: number = Date.now()): number {
  return Math.max(0, getLimiteNovas() - getNovasHoje(agora));
}
