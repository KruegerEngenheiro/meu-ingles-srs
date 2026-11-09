import { useCallback, useEffect, useRef, useState } from 'react';
import { useTema } from './hooks/useTema';
import { semearSeNecessario } from './db';
import type { CartaRica } from './types';
import seed from './dados/seed.json';
import { Icon } from './componentes/Icon';
import { Hoje } from './telas/Hoje';
import { Revisao } from './telas/Revisao';
import { Capturar } from './telas/Capturar';
import { Adicionar } from './telas/Adicionar';
import { Estatisticas } from './telas/Estatisticas';
import { Gerenciar } from './telas/Gerenciar';

type IconNome = React.ComponentProps<typeof Icon>['nome'];

export type Tela = 'hoje' | 'revisao' | 'capturar' | 'adicionar' | 'estatisticas' | 'gerenciar';

export function App() {
  const { tema, alternar } = useTema();
  const [tela, setTela] = useState<Tela>('hoje');
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  // Mostra uma mensagem rapida na parte de baixo.
  const mostrarToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  // Na primeira abertura, carrega a biblioteca inicial (as 500) direto no baralho.
  useEffect(() => {
    semearSeNecessario(seed as unknown as CartaRica[]).then((n) => {
      if (n > 0) mostrarToast(`${n} palavras adicionadas à sua biblioteca`);
    });
  }, [mostrarToast]);

  return (
    <div className="app">
      <header className="topo">
        <div className="logo">EN</div>
        <h1>Meu Inglês</h1>
        <button className="tema-btn" onClick={alternar} aria-label="Alternar tema" title="Alternar tema claro/escuro">
          <Icon nome={tema === 'escuro' ? 'sol' : 'lua'} size={20} />
        </button>
      </header>

      <main className="conteudo">
        {tela === 'hoje' && <Hoje onRevisar={() => setTela('revisao')} irPara={setTela} />}
        {tela === 'revisao' && <Revisao onFim={() => setTela('hoje')} toast={mostrarToast} />}
        {tela === 'capturar' && <Capturar toast={mostrarToast} />}
        {tela === 'adicionar' && <Adicionar toast={mostrarToast} />}
        {tela === 'estatisticas' && <Estatisticas />}
        {tela === 'gerenciar' && <Gerenciar toast={mostrarToast} />}
      </main>

      {toast && <div className="toast">{toast}</div>}

      {/* A barra some durante a revisao para focar no estudo */}
      {tela !== 'revisao' && (
        <nav className="nav">
          <BotaoNav atual={tela} alvo="hoje" rotulo="Hoje" icone="casa" ir={setTela} />
          <BotaoNav atual={tela} alvo="capturar" rotulo="Capturar" icone="raio" ir={setTela} />
          <BotaoNav atual={tela} alvo="adicionar" rotulo="Adicionar" icone="mais" ir={setTela} />
          <BotaoNav atual={tela} alvo="estatisticas" rotulo="Progresso" icone="grafico" ir={setTela} />
          <BotaoNav atual={tela} alvo="gerenciar" rotulo="Cartas" icone="cartas" ir={setTela} />
        </nav>
      )}
    </div>
  );
}

function BotaoNav({
  atual,
  alvo,
  rotulo,
  icone,
  ir
}: {
  atual: Tela;
  alvo: Tela;
  rotulo: string;
  icone: IconNome;
  ir: (t: Tela) => void;
}) {
  return (
    <button className={atual === alvo ? 'ativo' : ''} onClick={() => ir(alvo)}>
      <Icon nome={icone} />
      {rotulo}
    </button>
  );
}
