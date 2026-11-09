// Tipos centrais do app.

// Situacao de aprendizado de uma carta.
// 'nova'       -> ainda nao foi revisada nenhuma vez
// 'aprendendo' -> em processo, intervalo ainda curto
// 'revisao'    -> intervalo longo (>= 21 dias), considerada "madura"
export type Status = 'nova' | 'aprendendo' | 'revisao';

// Como o usuario avaliou o proprio desempenho na carta.
export type Nota = 'errei' | 'dificil' | 'bom' | 'facil';

// Nivel do Quadro Europeu Comum de Referencia (CEFR).
export type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// De onde a carta veio. Usado para filtrar e para a curadoria.
export type Fonte = 'seed' | 'manual' | 'import' | 'ai-enriched';

// Um significado da palavra (uma palavra pode ter varios).
export interface Significado {
  translation: string;        // traducao desse sentido, em pt-BR
  definitionEn?: string;      // definicao curta em ingles
  definitionPtBr?: string;    // definicao curta em pt-BR
}

// Uma carta (par palavra em ingles + traducao).
// Os campos "ingles", "portugues", "exemplo" e "exemploTraducao" sao o english, translation,
// exampleEn e examplePtBr do esquema rico. Os campos novos sao TODOS opcionais, para nao quebrar
// cartas antigas nem o progresso do SM-2.
export interface Carta {
  id?: number;
  ingles: string;             // english
  portugues: string;          // translation (traducao principal)
  exemplo?: string;           // exampleEn
  exemploTraducao?: string;   // examplePtBr
  tags: string[];             // categorias/etiquetas

  // Campos ricos (opcionais)
  partOfSpeech?: string;      // classe gramatical (noun, verb, phrasal verb, idiom...)
  ipa?: string;               // pronuncia em IPA (americano)
  pronunciationHintPtBr?: string; // dica de som em portugues
  cefr?: Cefr;                // nivel estimado
  meanings?: Significado[];   // outros significados
  dailyUsage?: string;        // explicacao curta de uso no dia a dia
  synonyms?: string[];
  antonyms?: string[];
  collocations?: string[];    // combinacoes naturais
  usageNotes?: string;        // observacoes de uso
  source?: Fonte;             // de onde veio
  updatedAt?: number;         // ultima edicao (epoch em ms)

  // Campos do algoritmo de repeticao espacada (SM-2)
  easeFactor: number;         // fator de facilidade, inicial 2.5, nunca < 1.3
  interval: number;           // intervalo atual em MINUTOS
  repetitions: number;        // quantos acertos consecutivos
  dueDate: number;            // quando volta a aparecer (epoch em ms)
  lastReviewedAt?: number;    // ultima revisao (epoch em ms)
  status: Status;

  suspensa: boolean;          // se true, nao entra na revisao
  criadaEm: number;           // quando foi cadastrada (epoch em ms) = createdAt
}

// Uma carta "rica" como vem do dataset seed ou de um JSON enriquecido (schema em ingles).
// E convertida para Carta na importacao.
export interface CartaRica {
  english: string;
  translation: string;
  partOfSpeech?: string;
  ipa?: string;
  pronunciationHintPtBr?: string;
  cefr?: Cefr;
  meanings?: Significado[];
  exampleEn?: string;
  examplePtBr?: string;
  dailyUsage?: string;
  synonyms?: string[];
  antonyms?: string[];
  collocations?: string[];
  usageNotes?: string;
  tags?: string[];
  source?: Fonte;
}

// Registro de cada revisao feita (alimenta as estatisticas e o grafico).
export interface Revisao {
  id?: number;
  cartaId: number;
  data: number;               // epoch em ms
  nota: Nota;
  acertou: boolean;           // true para dificil/bom/facil, false para errei
}
