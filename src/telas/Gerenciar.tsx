import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, existeIngles } from '../db';
import type { Carta } from '../types';

type Filtro = 'todas' | 'nova' | 'aprendendo' | 'revisao' | 'dificeis' | 'suspensas';

// Tela de gerenciamento: buscar, filtrar, editar, suspender e excluir cartas.
export function Gerenciar({ toast }: { toast: (m: string) => void }) {
  const cartas = useLiveQuery(() => db.cartas.orderBy('criadaEm').reverse().toArray());
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [editando, setEditando] = useState<Carta | null>(null);

  if (!cartas) return <div className="vazio">Carregando...</div>;

  const termo = busca.trim().toLowerCase();
  const lista = cartas.filter((c) => {
    if (termo && !c.ingles.toLowerCase().includes(termo) && !c.portugues.toLowerCase().includes(termo)) return false;
    switch (filtro) {
      case 'nova':
        return c.status === 'nova';
      case 'aprendendo':
        return c.status === 'aprendendo';
      case 'revisao':
        return c.status === 'revisao';
      case 'dificeis':
        return c.easeFactor < 2.0;
      case 'suspensas':
        return c.suspensa;
      default:
        return true;
    }
  });

  async function suspender(c: Carta) {
    await db.cartas.update(c.id!, { suspensa: !c.suspensa });
    toast(c.suspensa ? 'Carta reativada.' : 'Carta suspensa.');
  }

  async function excluir(c: Carta) {
    if (!window.confirm(`Excluir "${c.ingles}"? Isso não pode ser desfeito.`)) return;
    await db.cartas.delete(c.id!);
    toast('Carta excluída.');
  }

  return (
    <div>
      <div className="campo">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="🔎 Buscar palavra ou tradução" autoCapitalize="none" />
      </div>

      <div className="filtros">
        <Aba atual={filtro} alvo="todas" rotulo="Todas" set={setFiltro} />
        <Aba atual={filtro} alvo="nova" rotulo="Novas" set={setFiltro} />
        <Aba atual={filtro} alvo="aprendendo" rotulo="Aprendendo" set={setFiltro} />
        <Aba atual={filtro} alvo="revisao" rotulo="Revisão" set={setFiltro} />
        <Aba atual={filtro} alvo="dificeis" rotulo="Difíceis" set={setFiltro} />
        <Aba atual={filtro} alvo="suspensas" rotulo="Suspensas" set={setFiltro} />
      </div>

      {lista.length === 0 ? (
        <div className="vazio">Nenhuma carta neste filtro.</div>
      ) : (
        lista.map((c) => (
          <div className="item" key={c.id}>
            <div style={{ minWidth: 0 }}>
              <div className="en">
                {c.ingles} {c.suspensa && <span className="selo suspensa">suspensa</span>}
              </div>
              <div className="pt">{c.portugues}</div>
              <div style={{ marginTop: 4 }}>
                <span className={`selo ${c.status}`}>{rotuloStatus(c)}</span>
                {c.easeFactor < 2.0 && <span className="selo dificil" style={{ marginLeft: 4 }}>difícil</span>}
              </div>
            </div>
            <div className="acoes">
              <button onClick={() => suspender(c)} title={c.suspensa ? 'Reativar' : 'Suspender'}>
                {c.suspensa ? '▶️' : '⏸️'}
              </button>
              <button onClick={() => setEditando(c)} title="Editar">
                ✏️
              </button>
              <button onClick={() => excluir(c)} title="Excluir">
                🗑️
              </button>
            </div>
          </div>
        ))
      )}

      {editando && <ModalEditar carta={editando} aoFechar={() => setEditando(null)} toast={toast} />}
    </div>
  );
}

function Aba({ atual, alvo, rotulo, set }: { atual: Filtro; alvo: Filtro; rotulo: string; set: (f: Filtro) => void }) {
  return (
    <button className={atual === alvo ? 'ativo' : ''} onClick={() => set(alvo)}>
      {rotulo}
    </button>
  );
}

function rotuloStatus(c: Carta): string {
  if (c.status === 'nova') return 'nova';
  if (c.status === 'revisao') return 'revisão';
  return 'aprendendo';
}

// Modal simples de edicao.
function ModalEditar({ carta, aoFechar, toast }: { carta: Carta; aoFechar: () => void; toast: (m: string) => void }) {
  const [ingles, setIngles] = useState(carta.ingles);
  const [portugues, setPortugues] = useState(carta.portugues);
  const [exemplo, setExemplo] = useState(carta.exemplo ?? '');
  const [exemploTraducao, setExemploTraducao] = useState(carta.exemploTraducao ?? '');
  const [tags, setTags] = useState(carta.tags.join(', '));
  const [erro, setErro] = useState('');

  async function salvar() {
    if (!ingles.trim() || !portugues.trim()) {
      setErro('A palavra em inglês e a tradução são obrigatórias.');
      return;
    }
    if (await existeIngles(ingles, carta.id)) {
      setErro(`"${ingles.trim()}" já existe em outra carta.`);
      return;
    }
    await db.cartas.update(carta.id!, {
      ingles: ingles.trim(),
      portugues: portugues.trim(),
      exemplo: exemplo.trim() || undefined,
      exemploTraducao: exemploTraducao.trim() || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
    });
    toast('Carta atualizada.');
    aoFechar();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
      onClick={aoFechar}
    >
      <div
        className="cartao"
        style={{ width: '100%', maxWidth: 560, marginBottom: 0, borderRadius: '18px 18px 0 0', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="secao-titulo">Editar carta</div>
        {erro && <div className="aviso">{erro}</div>}
        <div className="campo">
          <label>Palavra em inglês</label>
          <input value={ingles} onChange={(e) => setIngles(e.target.value)} autoCapitalize="none" autoCorrect="off" />
        </div>
        <div className="campo">
          <label>Tradução</label>
          <input value={portugues} onChange={(e) => setPortugues(e.target.value)} />
        </div>
        <div className="campo">
          <label>Exemplo (opcional)</label>
          <input value={exemplo} onChange={(e) => setExemplo(e.target.value)} />
        </div>
        <div className="campo">
          <label>Tradução do exemplo (opcional)</label>
          <input value={exemploTraducao} onChange={(e) => setExemploTraducao(e.target.value)} />
        </div>
        <div className="campo">
          <label>Tags (separadas por vírgula)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div className="linha-botoes">
          <button className="btn secundario" onClick={aoFechar}>
            Cancelar
          </button>
          <button className="btn" onClick={salvar}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
