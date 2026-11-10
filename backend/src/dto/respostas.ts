// Formato das respostas da API. O senhaHash nunca é devolvido.
import type { IngressoDetalhado, ReservaDetalhada, SessaoDetalhada, Usuario } from "../domain/modelos.js";

export type UsuarioDto = { id: number; nome: string; email: string; papel: Usuario["papel"] };

export function usuarioDto(u: Usuario): UsuarioDto {
  return { id: u.id, nome: u.nome, email: u.email, papel: u.papel };
}

export function sessaoDto(s: SessaoDetalhada) {
  return {
    id: s.id,
    inicio: s.inicio,
    fim: s.fim,
    preco: s.preco,
    filme: s.filme,
    sala: s.sala,
  };
}

export function ingressoDto(i: IngressoDetalhado) {
  return {
    codigo: i.codigo,
    status: i.status,
    valor: i.valor,
    fila: i.fila,
    numero: i.numero,
    assento: `${i.fila}${i.numero}`,
    emitidoEm: i.emitidoEm,
    utilizadoEm: i.utilizadoEm,
    nomeCliente: i.nomeCliente,
    sessao: sessaoDto(i.sessao),
  };
}

export function reservaDto(r: ReservaDetalhada) {
  return {
    id: r.id,
    status: r.status,
    canal: r.canal,
    nomeCliente: r.nomeCliente,
    criadaEm: r.criadaEm,
    expiraEm: r.expiraEm,
    valorTotal: r.valorTotal,
    sessao: sessaoDto(r.sessao),
    assentos: r.assentos.map((a) => ({ id: a.assentoId, fila: a.fila, numero: a.numero, rotulo: `${a.fila}${a.numero}` })),
    ingressos: r.ingressos.map((i) => ({
      codigo: i.codigo,
      status: i.status,
      valor: i.valor,
      assento: `${i.fila}${i.numero}`,
    })),
  };
}
