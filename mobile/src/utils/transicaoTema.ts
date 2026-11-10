// No celular não existe View Transitions: o TemaProvider faz um esmaecimento.
// A versão da Web está em transicaoTema.web.ts.
export function transicaoSuave(_aplicar: () => void): boolean {
  return false;
}
