import type { ReservaService } from "../services/ReservaService.js";

// Chama o ReservaService de tempos em tempos pra liberar os assentos das reservas vencidas.
// Mesmo sem o job, uma reserva vencida já é tratada como livre no mapa.
export function iniciarJobExpiracao(reservas: ReservaService, intervaloMs = 30_000): () => void {
  let rodando = false;
  const timer = setInterval(async () => {
    if (rodando) return;
    rodando = true;
    try {
      const total = await reservas.expirarVencidas();
      if (total > 0) console.log(`[job] ${total} reserva(s) expirada(s); assentos liberados`);
    } catch (erro) {
      console.error("[job] falha ao expirar reservas", erro);
    } finally {
      rodando = false;
    }
  }, intervaloMs);
  timer.unref();
  return () => clearInterval(timer);
}
