// Guarda o usuário logado. O papel só decide a navegação; quem barra acesso de verdade é a API.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Usuario } from '@/models/tipos';
import { definirToken, quandoSessaoExpirar } from '@/services/api';
import { authService } from '@/services/cineon';
import { lerToken, removerToken, salvarToken } from '@/storage/tokenStorage';

type AuthContextType = {
  usuario: Usuario | null;
  verificando: boolean; // conferindo o token salvo ao abrir o app
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificando, setVerificando] = useState(true);

  const sair = useCallback(async () => {
    definirToken(null);
    await removerToken();
    setUsuario(null);
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
      } catch {
        await sair();
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
  }, []);

  const valor = useMemo(() => ({ usuario, verificando, entrar, sair }), [usuario, verificando, entrar, sair]);
  return <AuthContext value={valor}>{children}</AuthContext>;
}

export function useAuth(): AuthContextType {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return contexto;
}
