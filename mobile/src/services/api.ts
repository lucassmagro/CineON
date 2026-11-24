// EXPO_PUBLIC_API_URL vai junto no app compilado, então não pode ter segredo nenhum ali.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// os pôsteres da seed vêm como /posteres/arquivo.jpg, servidos pela própria API
export function urlArquivo(caminho: string | null | undefined): string | null {
  if (!caminho) return null;
  return caminho.startsWith('/') ? API_URL + caminho : caminho;
}

export class ErroApi extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly codigo?: string,
    readonly detalhes?: unknown,
  ) {
    super(message);
  }
}

let tokenAtual: string | null = null;
let aoExpirarSessao: (() => void) | null = null;

export function definirToken(token: string | null): void {
  tokenAtual = token;
}

// usado pra deslogar quando o token expira
export function quandoSessaoExpirar(callback: () => void): void {
  aoExpirarSessao = callback;
}

// arquivo vai cru no corpo (o upload do pôster), o resto vai em JSON
type Arquivo = { dados: Blob; tipo: string };

async function requisicao<T>(metodo: string, caminho: string, corpo?: unknown, arquivo?: Arquivo): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (arquivo) headers['Content-Type'] = arquivo.tipo;
  else if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (tokenAtual) headers.Authorization = `Bearer ${tokenAtual}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: arquivo ? arquivo.dados : corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    // o fetch só cai aqui quando não tem rede ou o servidor está fora
    throw new ErroApi(0, 'Sem conexão com o servidor. Verifique sua internet.');
  }

  const texto = await resposta.text();
  const json = texto ? (JSON.parse(texto) as Record<string, unknown>) : null;

  if (!resposta.ok) {
    if (resposta.status === 401 && tokenAtual && caminho !== '/auth/login') aoExpirarSessao?.();
    const mensagem = typeof json?.message === 'string' ? json.message : `Erro ${resposta.status}`;
    throw new ErroApi(resposta.status, mensagem, json?.codigo as string | undefined, json?.detalhes);
  }
  return json as T;
}

export const api = {
  get: <T>(caminho: string) => requisicao<T>('GET', caminho),
  post: <T>(caminho: string, corpo?: unknown) => requisicao<T>('POST', caminho, corpo ?? {}),
  put: <T>(caminho: string, corpo: unknown) => requisicao<T>('PUT', caminho, corpo),
  del: (caminho: string) => requisicao<null>('DELETE', caminho),
  enviarArquivo: <T>(caminho: string, dados: Blob, tipo: string) => requisicao<T>('POST', caminho, undefined, { dados, tipo }),
};

export function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Erro inesperado';
}
