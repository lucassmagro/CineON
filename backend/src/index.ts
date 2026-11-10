import { criarApp } from "./app.js";
import { PORTA, REGRAS } from "./config.js";
import { criarContainer } from "./container.js";
import { iniciarJobExpiracao } from "./jobs/expirarReservas.js";

const container = criarContainer();
iniciarJobExpiracao(container.services.reservas);

// 0.0.0.0 pra aceitar conexão do celular na rede local (Expo Go)
criarApp(container).listen(PORTA, "0.0.0.0", () => {
  console.log(`API do CineON em http://localhost:${PORTA} (reservas expiram em ${REGRAS.reservaMinutos} min)`);
});
