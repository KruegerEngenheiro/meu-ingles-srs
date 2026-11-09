// Banco local com Dexie (IndexedDB). Tudo fica no proprio aparelho, sem servidor.

import Dexie, { type Table } from 'dexie';
import type { Carta, CartaRica, Revisao, Nota, Fonte } from './types';
import { novaCartaBase, agendar } from './sm2';

export class BancoIngles extends Dexie {
  cartas!: Table<Carta, number>;
  revisoes!: Table<Revisao, number>;

  constructor() {
    super('meu-ingles-srs');

    // Versao 1: modelo inicial.
    this.version(1).stores({
      cartas: '++id, ingles, status, dueDate, easeFactor, suspensa, criadaEm',
      revisoes: '++id, cartaId, data'
    });

    // Versao 2: modelo rico. So ADICIONA indices novos (cefr, source) e preenche campos
    // faltantes nas cartas antigas. NAO toca em nada do SM-2 (ease, interval, dueDate, status).
    this.version(2)
      .stores({
        cartas: '++id, ingles, status, dueDate, easeFactor, suspensa, criadaEm, cefr, source',
        revisoes: '++id, cartaId, data'
      })
      .upgrade(async (tx) => {
        await tx
          .table('cartas')
          .toCollection()
          .modify((c: Carta) => {
            // cartas que ja existiam vieram do proprio usuario
            if (!c.source) c.source = 'manual';
            if (!c.updatedAt) c.updatedAt = c.criadaEm;
            if (!Array.isArray(c.tags)) c.tags = [];
          });
      });
  }
}

export const db = new BancoIngles();

// Converte uma carta "rica" (schema em ingles, do seed ou de um JSON enriquecido) para o modelo Carta.
export function cartaDeRica(r: CartaRica, fonte: Fonte = 'import'): Carta {
  const agora = Date.now();
  return {
    ingles: String(r.english ?? '').trim(),
    portugues: String(r.translation ?? '').trim(),
    exemplo: r.exampleEn?.trim() || undefined,
    exemploTraducao: r.examplePtBr?.trim() || undefined,
    tags: Array.isArray(r.tags) ? r.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    partOfSpeech: r.partOfSpeech || undefined,
    ipa: r.ipa || undefined,
    pronunciationHintPtBr: r.pronunciationHintPtBr || undefined,
    cefr: r.cefr,
    meanings: Array.isArray(r.meanings) && r.meanings.length ? r.meanings : undefined,
    dailyUsage: r.dailyUsage || undefined,
    synonyms: Array.isArray(r.synonyms) ? r.synonyms : undefined,
    antonyms: Array.isArray(r.antonyms) ? r.antonyms : undefined,
    collocations: Array.isArray(r.collocations) ? r.collocations : undefined,
    usageNotes: r.usageNotes || undefined,
    source: r.source || fonte,
    updatedAt: agora,
    criadaEm: agora,
    ...novaCartaBase()
  };
}

// Confere se ja existe uma carta com a mesma palavra em ingles (ignora maiusculas/minusculas).
export async function existeIngles(ingles: string, ignorarId?: number): Promise<boolean> {
  const alvo = ingles.trim().toLowerCase();
  const todas = await db.cartas.toArray();
  return todas.some((c) => c.ingles.trim().toLowerCase() === alvo && c.id !== ignorarId);
}

export interface NovaCarta {
  ingles: string;
  portugues: string;
  exemplo?: string;
  exemploTraducao?: string;
  tags?: string[];
}

// Adiciona uma carta nova digitada a mao. Retorna false se for duplicada.
export async function adicionarCarta(dados: NovaCarta): Promise<boolean> {
  if (!dados.ingles.trim() || !dados.portugues.trim()) return false;
  if (await existeIngles(dados.ingles)) return false;

  const agora = Date.now();
  const carta: Carta = {
    ingles: dados.ingles.trim(),
    portugues: dados.portugues.trim(),
    exemplo: dados.exemplo?.trim() || undefined,
    exemploTraducao: dados.exemploTraducao?.trim() || undefined,
    tags: dados.tags?.map((t) => t.trim()).filter(Boolean) || [],
    source: 'manual',
    updatedAt: agora,
    criadaEm: agora,
    ...novaCartaBase()
  };
  await db.cartas.add(carta);
  return true;
}

// Carrega o dataset inicial (biblioteca de 500) uma unica vez, direto no baralho.
// Protegido por um sinalizador no localStorage, para nao duplicar a cada abertura.
const CHAVE_SEED = 'seed-carregado-v1';

export async function semearSeNecessario(cartasRicas: CartaRica[]): Promise<number> {
  try {
    if (localStorage.getItem(CHAVE_SEED) === 'sim') return 0;
  } catch {
    // se o localStorage falhar, caimos no guarda por contagem abaixo
  }

  // Guarda extra: se o banco ja tem cartas do seed, nao recarrega.
  const jaTemSeed = await db.cartas.where('source').equals('seed').count();
  if (jaTemSeed > 0) {
    try {
      localStorage.setItem(CHAVE_SEED, 'sim');
    } catch {}
    return 0;
  }

  // Dedup contra o que o usuario ja tiver cadastrado (por ingles, sem diferenciar maiuscula).
  const existentes = new Set((await db.cartas.toArray()).map((c) => c.ingles.trim().toLowerCase()));
  const novas: Carta[] = [];
  const vistas = new Set<string>();
  for (const r of cartasRicas) {
    const chave = String(r.english ?? '').trim().toLowerCase();
    if (!chave || existentes.has(chave) || vistas.has(chave)) continue;
    vistas.add(chave);
    novas.push(cartaDeRica(r, 'seed'));
  }

  if (novas.length > 0) await db.cartas.bulkAdd(novas);
  try {
    localStorage.setItem(CHAVE_SEED, 'sim');
  } catch {}
  return novas.length;
}

// Adiciona uma carta rica (vinda da captura/enriquecimento). Retorna false se duplicada.
export async function adicionarCartaRica(r: CartaRica, fonte: Fonte = 'import'): Promise<boolean> {
  const ingles = String(r.english ?? '').trim();
  if (!ingles) return false;
  if (await existeIngles(ingles)) return false;
  await db.cartas.add(cartaDeRica(r, fonte));
  return true;
}

// Registra a resposta de uma carta na revisao e salva imediatamente.
export async function responderCarta(carta: Carta, nota: Nota): Promise<void> {
  const agora = Date.now();
  const ag = agendar(carta, nota, agora);
  await db.cartas.update(carta.id!, { ...ag, lastReviewedAt: agora });
  await db.revisoes.add({
    cartaId: carta.id!,
    data: agora,
    nota,
    acertou: nota !== 'errei'
  });
}

// Substitui todas as cartas (usado ao restaurar um backup).
export async function substituirTudo(cartas: Carta[]): Promise<void> {
  await db.transaction('rw', db.cartas, async () => {
    await db.cartas.clear();
    await db.cartas.bulkAdd(cartas);
  });
}
