import { useRef, useState } from 'react';
import { adicionarCarta, db, substituirTudo } from '../db';
import { parseColagem, exportarJSON, lerBackup, baixarArquivo } from '../utils/importExport';

// Tela de cadastro: uma palavra por vez, importar por colagem e backup JSON.
export function Adicionar({ toast }: { toast: (m: string) => void }) {
  const [ingles, setIngles] = useState('');
  const [portugues, setPortugues] = useState('');
  const [exemplo, setExemplo] = useState('');
  const [exemploTraducao, setExemploTraducao] = useState('');
  const [tags, setTags] = useState('');
  const [erro, setErro] = useState('');

  const [colagem, setColagem] = useState('');
  const refIngles = useRef<HTMLInputElement>(null);
  const refArquivo = useRef<HTMLInputElement>(null);

  async function salvarUma() {
    setErro('');
    if (!ingles.trim() || !portugues.trim()) {
      setErro('Preencha ao menos a palavra em inglês e a tradução.');
      return;
    }
    const ok = await adicionarCarta({
      ingles,
      portugues,
      exemplo,
      exemploTraducao,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
    });
    if (!ok) {
      setErro(`"${ingles.trim()}" já existe na sua lista.`);
      return;
    }
    // Limpa e mantem o foco para adicionar varias rapidamente.
    setIngles('');
    setPortugues('');
    setExemplo('');
    setExemploTraducao('');
    setTags('');
    toast('Palavra adicionada!');
    refIngles.current?.focus();
  }

  async function importarColagem() {
    const itens = parseColagem(colagem);
    if (itens.length === 0) {
      toast('Nenhuma linha válida encontrada.');
      return;
    }
    let add = 0;
    let dup = 0;
    for (const it of itens) {
      const ok = await adicionarCarta(it);
      if (ok) add++;
      else dup++;
    }
    setColagem('');
    toast(`${add} adicionadas${dup > 0 ? `, ${dup} já existiam` : ''}.`);
  }

  async function exportar() {
    const cartas = await db.cartas.toArray();
    if (cartas.length === 0) {
      toast('Nada para exportar ainda.');
      return;
    }
    const nome = `meu-ingles-backup-${new Date().toISOString().slice(0, 10)}.json`;
    baixarArquivo(nome, exportarJSON(cartas));
    toast('Backup gerado.');
  }

  async function importarArquivo(ev: React.ChangeEvent<HTMLInputElement>) {
    const arq = ev.target.files?.[0];
    if (!arq) return;
    try {
      const texto = await arq.text();
      const cartas = lerBackup(texto);
      if (cartas.length === 0) {
        toast('O backup não tem cartas válidas.');
        return;
      }
      const confirma = window.confirm(
        `Isto vai SUBSTITUIR suas ${(await db.cartas.count())} cartas atuais por ${cartas.length} do backup. Continuar?`
      );
      if (!confirma) return;
      await substituirTudo(cartas);
      toast(`Backup restaurado: ${cartas.length} cartas.`);
    } catch (e) {
      toast('Arquivo inválido. Verifique se é um backup JSON.');
    } finally {
      if (refArquivo.current) refArquivo.current.value = '';
    }
  }

  return (
    <div>
      <div className="cartao">
        <div className="secao-titulo">Adicionar palavra</div>
        {erro && <div className="aviso">{erro}</div>}

        <div className="campo">
          <label>Palavra em inglês</label>
          <input
            ref={refIngles}
            value={ingles}
            onChange={(e) => setIngles(e.target.value)}
            placeholder="ex.: deadline"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
        <div className="campo">
          <label>Tradução em português</label>
          <input value={portugues} onChange={(e) => setPortugues(e.target.value)} placeholder="ex.: prazo final" />
        </div>
        <div className="campo">
          <label>Exemplo em inglês (opcional)</label>
          <input value={exemplo} onChange={(e) => setExemplo(e.target.value)} placeholder="ex.: We missed the deadline." />
        </div>
        <div className="campo">
          <label>Tradução do exemplo (opcional)</label>
          <input
            value={exemploTraducao}
            onChange={(e) => setExemploTraducao(e.target.value)}
            placeholder="ex.: Nós perdemos o prazo final."
          />
        </div>
        <div className="campo">
          <label>Categorias/tags (opcional, separadas por vírgula)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ex.: trabalho, negócios" />
        </div>

        <button className="btn" onClick={salvarUma}>
          Adicionar e continuar
        </button>
      </div>

      <div className="cartao">
        <div className="secao-titulo">Importar várias (colar texto)</div>
        <p style={{ fontSize: 13, color: 'var(--texto-suave)', marginBottom: 10 }}>
          Uma palavra por linha, no formato: <strong>ingles;portugues;exemplo;traducao</strong>. Os dois últimos são opcionais.
        </p>
        <div className="campo">
          <textarea
            value={colagem}
            onChange={(e) => setColagem(e.target.value)}
            placeholder={'deadline;prazo final;We missed the deadline.;Nós perdemos o prazo final.\nbudget;orçamento;\nmeeting;reunião;'}
          />
        </div>
        <button className="btn secundario" onClick={importarColagem}>
          Importar lista
        </button>
      </div>

      <div className="cartao">
        <div className="secao-titulo">Backup</div>
        <div className="linha-botoes">
          <button className="btn secundario" onClick={exportar}>
            Exportar JSON
          </button>
          <button className="btn secundario" onClick={() => refArquivo.current?.click()}>
            Importar JSON
          </button>
        </div>
        <input ref={refArquivo} type="file" accept="application/json,.json" onChange={importarArquivo} style={{ display: 'none' }} />
        <p style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 10 }}>
          Importar um backup substitui todas as cartas atuais. Exporte antes se quiser guardar as de agora.
        </p>
      </div>
    </div>
  );
}
