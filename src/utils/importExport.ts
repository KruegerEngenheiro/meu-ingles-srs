// Importacao por colagem de texto, e backup/restauracao em JSON.

import type { Carta } from '../types';
import { novaCartaBase } from '../sm2';

export interface CartaColada {
  ingles: string;
  portugues: string;
  exemplo?: string;
  exemploTraducao?: string;
}

// Le o texto colado no formato: english;portugues;exemplo;traducao_do_exemplo (um por linha).
// Linhas sem a palavra em ingles ou sem a traducao sao ignoradas.
export function parseColagem(texto: string): CartaColada[] {
  const linhas = texto.split(/\r?\n/);
  const saida: CartaColada[] = [];
  for (const linha of linhas) {
    const bruta = linha.trim();
    if (!bruta) continue;
    const partes = bruta.split(';').map((p) => p.trim());
    const [ingles, portugues, exemplo, exemploTraducao] = partes;
    if (!ingles || !portugues) continue;
    saida.push({
      ingles,
      portugues,
      exemplo: exemplo || undefined,
      exemploTraducao: exemploTraducao || undefined
    });
  }
  return saida;
}

// Gera o conteudo do backup em JSON (texto).
export function exportarJSON(cartas: Carta[]): string {
  return JSON.stringify(
    {
      app: 'meu-ingles-srs',
      versao: 1,
      exportadoEm: new Date().toISOString(),
      total: cartas.length,
      cartas
    },
    null,
    2
  );
}

// Le um backup JSON e devolve as cartas ja normalizadas.
// Aceita tanto o formato { cartas: [...] } quanto um array direto.
export function lerBackup(texto: string): Carta[] {
  const obj = JSON.parse(texto);
  const lista = Array.isArray(obj) ? obj : obj?.cartas;
  if (!Array.isArray(lista)) throw new Error('Arquivo de backup inválido: não encontrei a lista de cartas.');
  return lista.map(normalizar).filter((c) => c.ingles && c.portugues);
}

// Garante que uma carta vinda de fora tenha todos os campos certos.
function normalizar(c: any): Carta {
  const base = novaCartaBase();
  return {
    ingles: String(c?.ingles ?? '').trim(),
    portugues: String(c?.portugues ?? '').trim(),
    exemplo: c?.exemplo ? String(c.exemplo) : undefined,
    exemploTraducao: c?.exemploTraducao ? String(c.exemploTraducao) : undefined,
    tags: Array.isArray(c?.tags) ? c.tags.map((t: any) => String(t)) : [],
    easeFactor: typeof c?.easeFactor === 'number' ? c.easeFactor : base.easeFactor,
    interval: typeof c?.interval === 'number' ? c.interval : base.interval,
    repetitions: typeof c?.repetitions === 'number' ? c.repetitions : base.repetitions,
    dueDate: typeof c?.dueDate === 'number' ? c.dueDate : Date.now(),
    lastReviewedAt: typeof c?.lastReviewedAt === 'number' ? c.lastReviewedAt : undefined,
    status: c?.status === 'nova' || c?.status === 'aprendendo' || c?.status === 'revisao' ? c.status : base.status,
    suspensa: !!c?.suspensa,
    criadaEm: typeof c?.criadaEm === 'number' ? c.criadaEm : Date.now()
  };
}

// Dispara o download de um arquivo de texto no navegador.
export function baixarArquivo(nome: string, conteudo: string, tipo = 'application/json'): void {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
