import cors from "cors";
import express from "express";
import { fileURLToPath } from "node:url";
import { CORS_ORIGENS } from "./config.js";
import { criarContainer, type Container } from "./container.js";
import { rotaNaoEncontrada, tratarErros } from "./middlewares/erros.js";
import { criarRotas } from "./routes/index.js";

export function criarApp(container: Container = criarContainer()) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // roda atrás do nginx

  // em dev CORS_ORIGENS fica vazio e libera tudo
  app.use(cors(CORS_ORIGENS.length > 0 ? { origin: CORS_ORIGENS } : {}));
  app.use(express.json({ limit: "100kb" }));

  if (process.env.NODE_ENV !== "test") {
    app.use((req, _res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
      next();
    });
  }

  // usado pra conferir se a API e o banco estão no ar depois do deploy
  app.get("/saude", async (_req, res) => {
    const banco = await container.verificarBanco().catch(() => false);
    res.status(banco ? 200 : 503).json({ status: banco ? "ok" : "erro", banco });
  });

  // pôsteres dos filmes da seed; o caminho vale tanto rodando de src/ quanto de dist/
  const posteres = fileURLToPath(new URL("../public/posteres", import.meta.url));
  app.use("/posteres", express.static(posteres, { maxAge: "7d" }));

  app.use(criarRotas(container));
  app.use(rotaNaoEncontrada);
  app.use(tratarErros); // tem que ser o último
  return app;
}
