// Monta a fila de cartas do dia.

import type { Carta } from './types';
import { novasRestantesHoje } from './config';

// Embaralha levemente uma lista, trocando itens vizinhos com 50% de chance em poucas passadas.
// Mantem a ordem aproximada (mais vencidas ainda tendem a vir antes), mas evita decorar a sequencia.
export function embaralharLeve<T>(lista: T[]): T[] {
  const a = lista.slice();
  for (let passada = 0; passada < 2; passada++) {
    for (let i = 0; i < a.length - 1; i++) {
      if (Math.random() < 0.5) {
        const tmp = a[i];
        a[i] = a[i + 1];
        a[i + 1] = tmp;
      }
    }
  }
  return a;
}

// Retorna a fila do dia: TODAS as revisoes vencidas (cartas que ja estao em aprendizado),
// mais um numero LIMITADO de palavras novas (ate o limite diario que ainda nao foi usado).
// Assim o usuario nunca e afogado por centenas de cartas novas de uma vez.
export function cartasDoDia(todas: Carta[], agora: number = Date.now()): Carta[] {
  const disponiveis = todas.filter((c) => !c.suspensa && c.dueDate <= agora);

  // Revisoes: cartas que ja foram estudadas (nao sao 'nova'). Entram todas, sem limite.
  const revisoes = disponiveis.filter((c) => c.status !== 'nova').sort((a, b) => a.dueDate - b.dueDate);

  // Novas: limitadas ao que ainda cabe hoje.
  const novas = disponiveis.filter((c) => c.status === 'nova');
  const restante = novasRestantesHoje(agora);
  const novasDoDia = embaralharLeve(novas).slice(0, restante);

  // Revisoes primeiro (com leve embaralhamento), depois as novas.
  return [...embaralharLeve(revisoes), ...novasDoDia];
}

// Quantas palavras NOVAS estao realmente disponiveis para hoje (para a tela inicial).
export function novasDisponiveisHoje(todas: Carta[], agora: number = Date.now()): number {
  const novas = todas.filter((c) => !c.suspensa && c.dueDate <= agora && c.status === 'nova').length;
  return Math.min(novas, novasRestantesHoje(agora));
}

// Conta quantas revisoes foram feitas hoje (para o progresso "12/30").
export function revisadasHoje(datas: number[], agora: number = Date.now()): number {
  const inicioDoDia = new Date(agora);
  inicioDoDia.setHours(0, 0, 0, 0);
  const limite = inicioDoDia.getTime();
  return datas.filter((d) => d >= limite).length;
}
