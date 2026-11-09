// Algoritmo de repeticao espacada (SM-2 simplificado).
// Tudo e calculado em MINUTOS para conseguir representar o intervalo curto de 10 min do "Errei".

import type { Carta, Nota } from './types';

export const MIN = 1;
export const HORA = 60;            // minutos em 1 hora
export const DIA = 24 * 60;        // minutos em 1 dia
export const EASE_MIN = 1.3;       // o fator de facilidade nunca cai abaixo disso
export const EASE_INICIAL = 2.5;   // fator inicial de uma carta nova
export const APRENDIDA_MIN = 21 * DIA; // a partir de 21 dias a carta e considerada "aprendida"

// Valores padrao de uma carta recem criada.
export function novaCartaBase(): Pick<
  Carta,
  'easeFactor' | 'interval' | 'repetitions' | 'dueDate' | 'status' | 'suspensa'
> {
  return {
    easeFactor: EASE_INICIAL,
    interval: 0,
    repetitions: 0,
    dueDate: Date.now(), // carta nova ja fica disponivel para o primeiro estudo
    status: 'nova',
    suspensa: false
  };
}

// Arredonda o intervalo para valores praticos:
// abaixo de 1 hora mantem em minutos; abaixo de 1 dia arredonda para horas; acima disso arredonda para dias.
export function arredondarIntervalo(minutos: number): number {
  if (minutos < HORA) return Math.max(1, Math.round(minutos));
  if (minutos < DIA) return Math.round(minutos / HORA) * HORA;
  return Math.round(minutos / DIA) * DIA;
}

export interface Agendamento {
  easeFactor: number;
  interval: number; // minutos
  repetitions: number;
  dueDate: number;  // epoch ms
  status: Carta['status'];
}

// Dado o estado atual da carta e a nota do usuario, calcula o proximo agendamento.
export function agendar(carta: Carta, nota: Nota, agora: number = Date.now()): Agendamento {
  let ease = carta.easeFactor;
  let rep = carta.repetitions;
  let intervalo: number; // em minutos

  if (nota === 'errei') {
    // Esqueceu: zera a contagem, reduz a facilidade e revisa de novo em 10 minutos.
    rep = 0;
    ease = Math.max(EASE_MIN, ease - 0.2);
    intervalo = 10;
  } else {
    // Base do SM-2 classico (em dias, aqui convertido para minutos).
    let base: number;
    if (rep === 0) base = 1 * DIA;        // primeiro acerto: 1 dia
    else if (rep === 1) base = 6 * DIA;   // segundo acerto consecutivo: 6 dias
    else base = carta.interval * ease;    // demais: intervalo anterior x fator de facilidade

    if (nota === 'dificil') {
      // Aumenta pouco e reduz levemente a facilidade.
      ease = Math.max(EASE_MIN, ease - 0.15);
      if (rep === 0) base = 0.5 * DIA;    // meio dia
      else if (rep === 1) base = 4 * DIA; // 4 dias
      else base = carta.interval * 1.2;
    } else if (nota === 'facil') {
      // Aumenta mais e eleva levemente a facilidade.
      ease = ease + 0.15;
      base = base * 1.3;
    }
    // 'bom' usa a base pura do SM-2, sem mexer na facilidade.

    rep = rep + 1;
    intervalo = base;
  }

  intervalo = arredondarIntervalo(intervalo);

  const status: Carta['status'] =
    nota === 'errei'
      ? 'aprendendo'
      : intervalo >= APRENDIDA_MIN
      ? 'revisao'
      : 'aprendendo';

  const dueDate = agora + intervalo * 60 * 1000;

  return {
    easeFactor: Number(ease.toFixed(2)),
    interval: intervalo,
    repetitions: rep,
    dueDate,
    status
  };
}

// Calcula, para cada um dos 4 botoes, quando a carta voltaria.
// Serve para mostrar "em 3 dias", "em 10 min" embaixo de cada botao antes de clicar.
export function previas(carta: Carta, agora: number = Date.now()): Record<Nota, number> {
  const notas: Nota[] = ['errei', 'dificil', 'bom', 'facil'];
  const resultado = {} as Record<Nota, number>;
  for (const n of notas) resultado[n] = agendar(carta, n, agora).dueDate;
  return resultado;
}
