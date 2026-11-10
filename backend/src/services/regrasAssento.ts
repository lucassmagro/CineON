import type { AssentoDaSessao, StatusAssento } from "../domain/modelos.js";

// Usada no mapa e na reserva. Assento reservado cuja reserva já venceu conta
// como livre, mesmo que o job ainda não tenha passado. Se estiver reservado e
// não der pra ver a reserva, por segurança considera ocupado.
export function estaDisponivel(a: AssentoDaSessao, agora: Date): boolean {
  if (a.status === "LIVRE") return true;
  if (a.status === "VENDIDO") return false;
  if (a.reservaStatus === "EXPIRADA" || a.reservaStatus === "CANCELADA") return true;
  if (a.reservaStatus !== "PENDENTE" || a.reservaExpiraEm === null) return false;
  return a.reservaExpiraEm.getTime() <= agora.getTime();
}

export function statusEfetivo(a: AssentoDaSessao, agora: Date): StatusAssento {
  if (a.status === "VENDIDO") return "VENDIDO";
  return estaDisponivel(a, agora) ? "LIVRE" : "RESERVADO";
}
