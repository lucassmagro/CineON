// Tela de conta, compartilhada por cliente e operador: perfil, resumo dos ingressos
// (só pro cliente), aparência e sair.
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Arte } from '@/components/Arte';
import { useAuth } from '@/contexts/AuthContext';
import { useCarregar } from '@/hooks/useCarregar';
import { useAgora } from '@/hooks/useContagem';
import type { Ingresso } from '@/models/tipos';
import { ingressoService } from '@/services/cineon';
import { Surgir } from '@/ui/animacoes';
import { useAparencia, type Aparencia } from '@/ui/aparencia';
import { tomDoTexto } from '@/ui/arteFilme';
import { Etiqueta, Linha, Secao, Segmentos, Tela, Texto } from '@/ui/componentes';
import { espaco, raio, useMargem, useTema } from '@/ui/tema';
import { Tocavel } from '@/ui/Tocavel';
import { confirmar } from '@/utils/dialogos';
import { dataHora, iniciais } from '@/utils/formatar';

// operador não tem ingressos; assim o hook é chamado sempre, sem condição
const semIngressos = async (): Promise<Ingresso[]> => [];

export function TelaConta() {
  const { usuario, sair } = useAuth();
  const c = useTema();
  const margem = useMargem();
  const router = useRouter();
  const agora = useAgora(60_000);
  const operador = usuario?.papel === 'OPERADOR';
  const { preferencia, definir } = useAparencia();
  const ingressos = useCarregar(operador ? semIngressos : ingressoService.meus, [operador]);

  async function sairDaConta() {
    if (await confirmar('Sair da conta?', 'Você vai precisar entrar de novo para comprar ou ver seus ingressos.', 'Sair', true)) await sair();
  }

  const lista = ingressos.dados ?? [];
  const validos = lista.filter((i) => i.status === 'VALIDO' && new Date(i.sessao.fim).getTime() > agora);
  const sessoesFuturas = new Set(validos.map((i) => i.sessao.id)).size;
  const assistidos = new Set(lista.filter((i) => i.status === 'UTILIZADO').map((i) => i.sessao.id)).size;
  const proxima = [...validos].sort((a, b) => a.sessao.inicio.localeCompare(b.sessao.inicio))[0];
  const lugaresDaProxima = proxima ? validos.filter((i) => i.sessao.id === proxima.sessao.id).length : 0;

  const nome = usuario?.nome ?? '';
  const versao = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Tela semCabecalho titulo="Conta">
      <Surgir>
        <View style={[estilos.perfil, { marginHorizontal: margem, backgroundColor: c.fundoElevado }]}>
          <View style={[estilos.avatar, { backgroundColor: tomDoTexto(nome) }]}>
            <Texto tipo="titulo1" cor="#FFFFFF" style={estilos.iniciais}>
              {iniciais(nome)}
            </Texto>
          </View>
          <View style={estilos.identidade}>
            <Texto tipo="titulo2" numberOfLines={1}>
              {nome}
            </Texto>
            <Texto tipo="subtitulo" cor="secundario" numberOfLines={1}>
              {usuario?.email}
            </Texto>
            <View style={{ marginTop: espaco.s }}>
              <Etiqueta texto={operador ? 'Operador do cinema' : 'Cliente'} cor={operador ? c.indigo : c.azul} icone={operador ? 'briefcase' : 'person'} />
            </View>
          </View>
        </View>
      </Surgir>

      {!operador ? (
        <Surgir indice={1}>
          <View style={[estilos.resumo, { marginHorizontal: margem, backgroundColor: c.fundoElevado }]}>
            <Numero valor={ingressos.carregando ? null : validos.length} rotulo={validos.length === 1 ? 'ingresso válido' : 'ingressos válidos'} />
            <View style={[estilos.divisor, { backgroundColor: c.separador }]} />
            <Numero valor={ingressos.carregando ? null : sessoesFuturas} rotulo={sessoesFuturas === 1 ? 'sessão marcada' : 'sessões marcadas'} />
            <View style={[estilos.divisor, { backgroundColor: c.separador }]} />
            <Numero valor={ingressos.carregando ? null : assistidos} rotulo={assistidos === 1 ? 'filme assistido' : 'filmes assistidos'} />
          </View>

          {proxima ? (
            <Secao titulo="Próxima sessão">
              <Linha
                esquerda={<Arte titulo={proxima.sessao.filme.titulo} id={proxima.sessao.filme.id} poster={proxima.sessao.filme.posterUrl} mini />}
                titulo={proxima.sessao.filme.titulo}
                subtitulo={`${dataHora(proxima.sessao.inicio)}, ${proxima.sessao.sala.nome}, ${lugaresDaProxima === 1 ? '1 lugar' : `${lugaresDaProxima} lugares`}`}
                aoTocar={() => router.navigate('/ingressos')}
                ultima
              />
            </Secao>
          ) : null}
        </Surgir>
      ) : (
        <Secao nota="Operadores vendem no balcão, validam a entrada e cuidam da programação do cinema.">
          <Linha icone={{ nome: 'storefront', cor: c.azul }} titulo="Bilheteria" aoTocar={() => router.navigate('/bilheteria')} />
          <Linha icone={{ nome: 'briefcase', cor: c.indigo }} titulo="Gerência" aoTocar={() => router.navigate('/gerencia')} ultima />
        </Secao>
      )}

      <Surgir indice={2}>
        <Secao titulo="Aparência" nota={preferencia === 'sistema' ? 'No automático, o CineON acompanha o modo claro ou escuro do aparelho.' : undefined}>
          <View style={estilos.aparencia}>
            <Segmentos<Aparencia>
              opcoes={[
                { valor: 'sistema', rotulo: 'Automático' },
                { valor: 'claro', rotulo: 'Claro' },
                { valor: 'escuro', rotulo: 'Escuro' },
              ]}
              valor={preferencia}
              aoMudar={(v) => definir(v)}
            />
          </View>
        </Secao>
      </Surgir>

      <Surgir indice={3}>
        <View style={{ marginHorizontal: margem }}>
          <Tocavel
            onPress={sairDaConta}
            escala={0.98}
            realce={c.preenchimento}
            vibracao="media"
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            style={[estilos.sair, { backgroundColor: c.fundoElevado }]}>
            <Texto cor="vermelho" peso="500">
              Sair da conta
            </Texto>
          </Tocavel>
        </View>

        <View style={estilos.rodape}>
          <Texto tipo="legenda" cor="terciario" style={estilos.rodapeTexto}>
            CineON {versao}
          </Texto>
          <Texto tipo="legenda" cor="terciario" style={estilos.rodapeTexto}>
            Programação II e Banco de Dados II, UNOESC 2026
          </Texto>
        </View>
      </Surgir>
    </Tela>
  );
}

function Numero({ valor, rotulo }: { valor: number | null; rotulo: string }) {
  return (
    <View style={estilos.numero}>
      <Texto tipo="titulo1" style={estilos.numeroValor}>
        {valor ?? '–'}
      </Texto>
      <Texto tipo="legenda" cor="secundario" style={{ textAlign: 'center' }} numberOfLines={2}>
        {rotulo}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  perfil: { flexDirection: 'row', alignItems: 'center', gap: espaco.l, padding: espaco.l, borderRadius: raio.cartao, marginBottom: espaco.l },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  iniciais: { letterSpacing: 0.5 },
  identidade: { flex: 1, alignItems: 'flex-start' },
  resumo: { flexDirection: 'row', alignItems: 'center', borderRadius: raio.cartao, paddingVertical: espaco.l, marginBottom: espaco.xxl },
  numero: { flex: 1, alignItems: 'center', paddingHorizontal: espaco.xs },
  numeroValor: { fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  divisor: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: espaco.xs },
  aparencia: { padding: espaco.m },
  sair: { minHeight: 50, borderRadius: raio.medio, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  rodape: { alignItems: 'center', gap: 2, marginTop: espaco.xxl },
  rodapeTexto: { textAlign: 'center' },
});
