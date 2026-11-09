// Enriquecimento automatico de uma palavra nova, com servicos gratuitos, sem chave e que
// PERMITEM chamada do navegador (CORS). Precisa de internet no momento da captura.
// - Datamuse (api.datamuse.com): classe gramatical, definicoes e sinonimos.
// - MyMemory (api.mymemory.translated.net): traducao pt-BR.
// IPA e exemplo nao vem automatico aqui (exigiriam backend); o usuario completa na tela se quiser.

import type { CartaRica } from './types';

const POS: Record<string, string> = {
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  prop: 'proper noun',
  u: ''
};

async function traduzir(texto: string): Promise<string> {
  const t = (texto || '').trim();
  if (!t) return '';
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=en|pt-BR`;
    const r = await fetch(url);
    if (!r.ok) return '';
    const j = await r.json();
    let out = j?.responseData?.translatedText;
    if (typeof out !== 'string') return '';
    // limpeza leve: tira ponto final solto quando e uma palavra so
    if (!t.includes(' ')) out = out.replace(/\.$/, '').trim();
    return out;
  } catch {
    return '';
  }
}

export interface ResultadoEnriquecimento {
  carta: CartaRica;
  avisos: string[];
  achouNoDicionario: boolean;
}

export async function enriquecerPalavra(palavra: string): Promise<ResultadoEnriquecimento> {
  const word = (palavra || '').trim();
  const avisos: string[] = [];
  const carta: CartaRica = { english: word, translation: '', source: 'import', tags: [] };
  let achouNoDicionario = false;

  // 1) Datamuse: definicoes + classe gramatical
  try {
    const r = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dp&max=1`);
    if (r.ok) {
      const arr = await r.json();
      const item = Array.isArray(arr) && arr.length ? arr[0] : null;
      if (item && String(item.word).toLowerCase() === word.toLowerCase() && Array.isArray(item.defs) && item.defs.length) {
        achouNoDicionario = true;
        const sig: { translation: string; definitionEn?: string }[] = [];
        let primeiroPos = '';
        for (const d of item.defs.slice(0, 3)) {
          // formato "pos\tdefinition"
          const partes = String(d).split('\t');
          const pos = partes.length > 1 ? partes[0] : '';
          const texto = partes.length > 1 ? partes[1] : partes[0];
          if (!primeiroPos && pos) primeiroPos = pos;
          if (texto) sig.push({ translation: '', definitionEn: texto });
        }
        if (sig.length) carta.meanings = sig;
        if (primeiroPos && POS[primeiroPos]) carta.partOfSpeech = POS[primeiroPos];
      }
    }
  } catch {
    // sem rede ou servico fora do ar
  }

  // 2) Datamuse: sinonimos
  try {
    const r = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=6`);
    if (r.ok) {
      const arr = await r.json();
      if (Array.isArray(arr) && arr.length) carta.synonyms = arr.map((x: any) => x.word).filter(Boolean).slice(0, 6);
    }
  } catch {}

  if (!achouNoDicionario) {
    avisos.push('Não encontrei definição (pode ser gíria, nome próprio ou erro de digitação). Dá pra salvar mesmo assim e completar à mão.');
  }

  // 3) Traducao da palavra
  carta.translation = await traduzir(word);
  if (!carta.translation) avisos.push('A tradução automática não respondeu agora. Preencha a tradução à mão.');
  if (carta.meanings && carta.meanings.length && carta.translation) {
    carta.meanings[0].translation = carta.translation;
  }

  return { carta, avisos, achouNoDicionario };
}
