// Guarda o usuário logado. O papel só decide a navegação; quem barra acesso de verdade é a API.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Usuario } from '@/models/tipos';
import { definirToken, ErroApi, quandoSessaoExpirar } from '@/services/api';
import { authService } from '@/services/cineon';
import { lerToken, removerToken, salvarToken } from '@/storage/tokenStorage';

// dados da animação de boas-vindas logo depois de entrar
export type BoasVindas = { nome: string; operador: boolean; hora: number };

type AuthContextType = {
  usuario: Usuario | null;
  verificando: boolean; // conferindo o token salvo ao abrir o app
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  boasVindas: BoasVindas | null;
  encerrarBoasVindas: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [boasVindas, setBoasVindas] = useState<BoasVindas | null>(null);

  const sair = useCallback(async () => {
    definirToken(null);
    await removerToken();
    setUsuario(null);
    setBoasVindas(null);
  }, []);

  // se tiver token salvo, pergunta pra API quem é o usuário
  useEffect(() => {
    quandoSessaoExpirar(() => {
      void sair();
    });
    (async () => {
      try {
        const token = await lerToken();
        if (!token) return;
        definirToken(token);
        setUsuario(await authService.eu());
      } catch (e) {
        // sem rede ou API fora do ar: mantém o token salvo pra tentar de novo no próximo carregamento.
        // Qualquer outro erro (token vencido ou inválido) encerra a sessão.
        if (!(e instanceof ErroApi && e.status === 0)) await sair();
      } finally {
        setVerificando(false);
      }
    })();
  }, [sair]);

  const entrar = useCallback(async (email: string, senha: string) => {
    const { usuario: logado, accessToken } = await authService.login(email.trim(), senha);
    definirToken(accessToken);
    await salvarToken(accessToken);
    setUsuario(logado);
    // só no login de verdade; recarregar a página com o token salvo não mostra de novo
    setBoasVindas({ nome: logado.nome.trim().split(/\s+/)[0] ?? logado.nome, operador: logado.papel === 'OPERADOR', hora: new Date().getHours() });
  }, []);

  const encerrarBoasVindas = useCallback(() => setBoasVindas(null), []);

  const valor = useMemo(
    () => ({ usuario, verificando, entrar, sair, boasVindas, encerrarBoasVindas }),
    [usuario, verificando, entrar, sair, boasVindas, encerrarBoasVindas],
  );
  return <AuthContext value={valor}>{children}</AuthContext>;
}

export function useAuth(): AuthContextType {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return contexto;
}
