// Tema claro/escuro, salvo no proprio aparelho (localStorage).

import { useEffect, useState } from 'react';

export type Tema = 'claro' | 'escuro';

function temaInicial(): Tema {
  try {
    const salvo = localStorage.getItem('tema');
    if (salvo === 'claro' || salvo === 'escuro') return salvo;
  } catch {
    // em modo privado o localStorage pode falhar; seguimos pelo tema do sistema
  }
  const prefereEscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefereEscuro ? 'escuro' : 'claro';
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    try {
      localStorage.setItem('tema', tema);
    } catch {
      // ignora se nao der para salvar
    }
  }, [tema]);

  const alternar = () => setTema((t) => (t === 'escuro' ? 'claro' : 'escuro'));

  return { tema, alternar };
}
