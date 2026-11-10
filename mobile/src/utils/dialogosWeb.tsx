// Toasts da Web (react-toastify), no lugar do alert
// e do confirm do navegador. Chamado pelo dialogos.web.ts; o contêiner fica em ui/Toasts.web.tsx.
import { toast, type Id } from 'react-toastify';

import { useTema } from '@/ui/tema';

export type TipoAviso = 'sucesso' | 'erro' | 'info';

function Texto({ titulo, mensagem }: { titulo: string; mensagem?: string }) {
  const c = useTema();
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: c.rotulo }}>{titulo}</div>
      {mensagem ? <div style={{ fontSize: 14, lineHeight: 1.35, color: c.rotuloSecundario, marginTop: 2 }}>{mensagem}</div> : null}
    </div>
  );
}

export function notificar(tipo: TipoAviso, titulo: string, mensagem?: string): void {
  const conteudo = <Texto titulo={titulo} mensagem={mensagem} />;
  if (tipo === 'sucesso') toast.success(conteudo);
  else if (tipo === 'erro') toast.error(conteudo);
  else toast.info(conteudo);
}

type PropsConfirmacao = {
  titulo: string;
  mensagem: string;
  textoConfirmar: string;
  textoDesistir: string;
  destrutivo: boolean;
  decidir: (valor: boolean) => void;
};

function Confirmacao({ titulo, mensagem, textoConfirmar, textoDesistir, destrutivo, decidir }: PropsConfirmacao) {
  const c = useTema();
  const botao = { flex: 1, height: 40, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as const;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 600, color: c.rotulo }}>{titulo}</div>
        <div style={{ fontSize: 15, lineHeight: 1.35, color: c.rotuloSecundario, marginTop: 4 }}>{mensagem}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="cineon-toast-botao" autoFocus onClick={() => decidir(false)} style={{ ...botao, background: c.preenchimento, color: c.rotulo }}>
          {textoDesistir}
        </button>
        <button className="cineon-toast-botao" onClick={() => decidir(true)} style={{ ...botao, background: destrutivo ? c.vermelho : c.azul, color: '#FFFFFF' }}>
          {textoConfirmar}
        </button>
      </div>
    </div>
  );
}

// uma confirmação por vez: abrir outra fecha a anterior como "não"
let abertaAgora: Id | null = null;

export function confirmar(
  titulo: string,
  mensagem: string,
  textoConfirmar = 'Confirmar',
  destrutivo = false,
  textoDesistir = 'Cancelar',
): Promise<boolean> {
  if (abertaAgora !== null) toast.dismiss(abertaAgora);
  return new Promise((resolver) => {
    let decidido = false;
    const decidir = (valor: boolean) => {
      if (decidido) return;
      decidido = true;
      resolver(valor);
      if (abertaAgora === id) abertaAgora = null;
      toast.dismiss(id);
    };
    const id = toast(<Confirmacao {...{ titulo, mensagem, textoConfirmar, textoDesistir, destrutivo, decidir }} />, {
      autoClose: false,
      closeOnClick: false,
      closeButton: false,
      draggable: false,
      icon: false,
      className: 'cineon-toast-confirmacao',
      onClose: () => decidir(false),
    });
    abertaAgora = id;
  });
}
