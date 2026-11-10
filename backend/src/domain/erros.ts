// Erros de negócio. Cada um só informa a categoria; o status HTTP é decidido
// no middleware tratarErros, assim os services não dependem do Express.

export type CategoriaErro =
  | "NAO_ENCONTRADO"
  | "NAO_AUTENTICADO"
  | "PROIBIDO"
  | "CONFLITO"
  | "EXPIRADO"
  | "REGRA_VIOLADA";

export abstract class ErroDominio extends Error {
  abstract readonly categoria: CategoriaErro;
  // dados extras pro app, ex.: quais assentos ficaram indisponíveis
  readonly detalhes?: unknown;

  constructor(mensagem: string, detalhes?: unknown) {
    super(mensagem);
    this.name = new.target.name;
    this.detalhes = detalhes;
  }
}

export class RecursoNaoEncontradoError extends ErroDominio {
  readonly categoria = "NAO_ENCONTRADO";
  constructor(recurso: string) {
    super(`${recurso} não encontrado(a)`);
  }
}

export class CredenciaisInvalidasError extends ErroDominio {
  readonly categoria = "NAO_AUTENTICADO";
  constructor() {
    super("E-mail ou senha inválidos");
  }
}

export class AcessoNegadoError extends ErroDominio {
  readonly categoria = "PROIBIDO";
  constructor(mensagem = "Você não tem permissão para acessar este recurso") {
    super(mensagem);
  }
}

export class ConflitoError extends ErroDominio {
  readonly categoria = "CONFLITO";
}

export class EmailJaCadastradoError extends ConflitoError {
  constructor() {
    super("Já existe uma conta com este e-mail");
  }
}

export class AssentoIndisponivelError extends ConflitoError {
  constructor(readonly assentos: string[]) {
    super(
      assentos.length === 1
        ? `O assento ${assentos[0]} acabou de ficar indisponível`
        : `Os assentos ${assentos.join(", ")} acabaram de ficar indisponíveis`,
      { assentos },
    );
  }
}

export class SessaoSobrepostaError extends ConflitoError {
  constructor() {
    super("Já existe uma sessão nesta sala nesse horário");
  }
}

export class ReservaInvalidaError extends ConflitoError {}

export class IngressoJaUtilizadoError extends ConflitoError {
  constructor(readonly utilizadoEm: Date) {
    super("Ingresso já utilizado", { utilizadoEm });
  }
}

export class ReservaExpiradaError extends ErroDominio {
  readonly categoria = "EXPIRADO";
  constructor() {
    super("O prazo da reserva expirou e os assentos foram liberados. Escolha os assentos novamente.");
  }
}

export class RegraNegocioError extends ErroDominio {
  readonly categoria = "REGRA_VIOLADA";
}
