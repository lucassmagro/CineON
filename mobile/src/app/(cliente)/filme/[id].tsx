import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Arte } from '@/components/Arte';
import { SeloClassificacao, textoClassificacao } from '@/components/SeloClassificacao';
import { SeletorDia } from '@/components/SeletorDia';
import { Trailer } from '@/components/Trailer';
import { useCarregar } from '@/hooks/useCarregar';
import { filmeService } from '@/services/cineon';
import { Surgir } from '@/ui/animacoes';
import { Carregando, MensagemErro, Tela, Texto, Vazio } from '@/ui/componentes';
import { paletaDoFilme } from '@/ui/coresPoster';
import { espaco, larguraLeitura, useMargem, useTema } from '@/ui/tema';
import { Tocavel } from '@/ui/Tocavel';
import { chaveDia, diaAmigavel, dinheiro, duracao, hora } from '@/utils/formatar';

const LARGURA_MIN_HORARIO = 104;
const GAP = 10;
// a abertura colorida pode ser mais larga que o texto do resto da página
const LARGURA_ABERTURA = 980;

export default function DetalheFilme() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const c = useTema();
  const margem = useMargem();
  const { width } = useWindowDimensions();
  const vm = useCarregar(() => filmeService.buscar(Number(id)), [id]);
  const [diaEscolhido, setDiaEscolhido] = useState<string | null>(null);

  const paleta = vm.dados ? paletaDoFilme(vm.dados) : null;
  const fundoCabecalho = paleta?.fundo;

  // o cabeçalho (com a seta de voltar) entra na cor da abertura
  useEffect(() => {
    if (!fundoCabecalho) return;
    navigation.setOptions({ title: '', headerStyle: { backgroundColor: fundoCabecalho }, headerTintColor: '#FFFFFF' });
  }, [navigation, fundoCabecalho]);

  if (vm.carregando) return <Carregando />;
  if (vm.erro || !vm.dados || !paleta) return <MensagemErro mensagem={vm.erro ?? 'Filme não encontrado'} aoTentarDeNovo={vm.recarregar} />;

  const filme = vm.dados;
  const dias = [...new Set(filme.sessoes.map((s) => chaveDia(s.inicio)))];
  const dia = diaEscolhido && dias.includes(diaEscolhido) ? diaEscolhido : (dias[0] ?? null);
  const sessoesDoDia = filme.sessoes.filter((s) => chaveDia(s.inicio) === dia);
  const proxima = filme.sessoes[0];

  // grade de horários: quantas colunas cabem na largura disponível
  const disponivel = Math.min(width, larguraLeitura) - 2 * margem;
  const colunas = Math.max(2, Math.floor((disponivel + GAP) / (LARGURA_MIN_HORARIO + GAP)));
  const larguraHorario = Math.floor((disponivel - GAP * (colunas - 1)) / colunas);
  const larga = width >= 700;
  const larguraPoster = larga ? 260 : Math.min(230, Math.round(width * 0.56));
  // no desktop o trailer ocupa a largura da abertura, como uma tela de cinema
  const larguraTrailer = larga ? Math.min(width, LARGURA_ABERTURA) - 2 * margem : disponivel;

  return (
    <Tela largura={100000}>
      <StatusBar style="light" />

      {/* abertura na cor do pôster */}
      <View style={[estilos.abertura, { backgroundColor: paleta.fundo }]}>
        {/* cobre o "puxar além do topo" no iOS com a mesma cor */}
        <View style={[estilos.acimaDoTopo, { backgroundColor: paleta.fundo }]} />
        <View
          style={[
            estilos.aberturaConteudo,
            { paddingHorizontal: margem, maxWidth: LARGURA_ABERTURA },
            larga ? estilos.aberturaLarga : estilos.aberturaEstreita,
          ]}>
          <Surgir indice={0}>
            <View style={estilos.sombraPoster}>
              <Arte titulo={filme.titulo} id={filme.id} poster={filme.posterUrl} estilo={{ width: larguraPoster, borderRadius: 14 }} />
            </View>
          </Surgir>

          <Surgir indice={2} style={[estilos.info, larga ? null : estilos.infoCentro]}>
            <Text style={[estilos.genero, { color: paleta.destaque }]}>{filme.genero.toUpperCase()}</Text>
            <Text style={[estilos.titulo, larga ? estilos.tituloLargo : estilos.tituloEstreito, { textAlign: larga ? 'left' : 'center' }]}>{filme.titulo}</Text>

            {/* no celular vira três colunas iguais; a próxima sessão põe o dia embaixo da hora */}
            <View style={[estilos.ficha, larga ? null : estilos.fichaEstreita]}>
              <ItemFicha rotulo="Duração" coluna={!larga}>
                <Text style={estilos.fichaValor}>{duracao(filme.duracaoMin)}</Text>
              </ItemFicha>
              <View style={[estilos.fichaDivisor, larga ? null : estilos.fichaDivisorEstreito]} />
              <ItemFicha rotulo="Classificação" coluna={!larga}>
                <SeloClassificacao valor={filme.classificacao} tamanho={22} />
              </ItemFicha>
              {proxima ? (
                <>
                  <View style={[estilos.fichaDivisor, larga ? null : estilos.fichaDivisorEstreito]} />
                  <ItemFicha rotulo={larga ? 'Próxima sessão' : 'Próxima'} coluna={!larga}>
                    {larga ? (
                      <Text style={estilos.fichaValor}>
                        {diaAmigavel(proxima.inicio)}, {hora(proxima.inicio)}
                      </Text>
                    ) : (
                      <>
                        <Text style={estilos.fichaValor}>{hora(proxima.inicio)}</Text>
                        <Text style={estilos.fichaDetalhe}>{diaAmigavel(proxima.inicio)}</Text>
                      </>
                    )}
                  </ItemFicha>
                </>
              ) : null}
            </View>

            {filme.sinopse ? <Text style={[estilos.sinopse, { textAlign: larga ? 'left' : 'center' }]}>{filme.sinopse}</Text> : null}
            <Text style={[estilos.aviso, { textAlign: larga ? 'left' : 'center' }]}>{textoClassificacao(filme.classificacao)}</Text>
          </Surgir>
        </View>
      </View>

      {/* no desktop o corpo começa na mesma margem do pôster */}
      <View style={[estilos.corpo, { maxWidth: larga ? LARGURA_ABERTURA : larguraLeitura }]}>
        <Secao titulo="Trailer" cor={paleta.destaque} margem={margem}>
          <View style={{ paddingHorizontal: margem }}>
            <Trailer filme={filme} largura={larguraTrailer} cor={paleta.medio} />
          </View>
        </Secao>

        <Secao titulo="Sessões" cor={paleta.destaque} margem={margem} nota={dias.length > 0 ? `${filme.sessoes.length} nos próximos dias` : undefined}>
          {dias.length === 0 ? (
            <Vazio icone="calendar-outline" titulo="Sem sessões futuras" texto="Volte mais tarde para ver a nova programação." />
          ) : (
            <>
              <SeletorDia dias={dias} valor={dia} aoMudar={setDiaEscolhido} corAtiva={paleta.destaque} corTextoAtivo={paleta.sobreDestaque} />
              <View style={[estilos.horarios, { paddingHorizontal: margem, gap: GAP, maxWidth: disponivel + 2 * margem }]}>
                {sessoesDoDia.map((s) => (
                  <Tocavel
                    key={s.id}
                    onPress={() => router.push({ pathname: '/sessao/[id]', params: { id: s.id } })}
                    escala={0.95}
                    escalaHover={1.02}
                    accessibilityRole="button"
                    accessibilityLabel={`Sessão das ${hora(s.inicio)}, ${s.sala.nome}, ${dinheiro(s.preco)}`}
                    estiloPressionado={{ backgroundColor: c.preenchimentoForte }}
                    style={[estilos.horario, { width: larguraHorario, backgroundColor: c.fundoElevado }]}>
                    <Texto tipo="titulo2" peso="600" style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.3 }}>
                      {hora(s.inicio)}
                    </Texto>
                    <View>
                      <Texto tipo="nota" cor="secundario">
                        {s.sala.nome}
                      </Texto>
                      <Texto tipo="nota" peso="600" cor="rotulo">
                        {dinheiro(s.preco)}
                      </Texto>
                    </View>
                  </Tocavel>
                ))}
              </View>
            </>
          )}
        </Secao>
      </View>
    </Tela>
  );
}

function ItemFicha({ rotulo, coluna, children }: { rotulo: string; coluna?: boolean; children: ReactNode }) {
  return (
    <View style={[estilos.fichaItem, coluna ? estilos.fichaColuna : null]}>
      <Text style={estilos.fichaRotulo}>{rotulo.toUpperCase()}</Text>
      <View style={[estilos.fichaConteudo, coluna ? { alignItems: 'center' } : null]}>{children}</View>
    </View>
  );
}

// título de seção com um traço curto na cor do pôster
function Secao({ titulo, nota, cor, margem, children }: { titulo: string; nota?: string; cor: string; margem: number; children: ReactNode }) {
  return (
    <View style={estilos.secao}>
      <View style={[estilos.secaoCabecalho, { paddingHorizontal: margem }]}>
        <View style={[estilos.secaoTraco, { backgroundColor: cor }]} />
        <Texto tipo="titulo2">{titulo}</Texto>
        {nota ? (
          <Texto tipo="nota" cor="secundario" style={{ marginLeft: 'auto' }}>
            {nota}
          </Texto>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  abertura: { marginTop: -espaco.s, paddingTop: espaco.l, paddingBottom: espaco.xxxl + espaco.s, width: '100%' },
  acimaDoTopo: { position: 'absolute', left: 0, right: 0, top: -800, height: 800 },
  aberturaConteudo: { width: '100%', alignSelf: 'center' },
  aberturaLarga: { flexDirection: 'row', alignItems: 'center', gap: 48, paddingTop: espaco.l },
  aberturaEstreita: { alignItems: 'center', gap: 28 },
  sombraPoster: {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
  },
  info: { flex: 1, gap: 12 },
  infoCentro: { alignItems: 'center', flex: 0, width: '100%' },
  genero: { fontSize: 13, fontWeight: '700', letterSpacing: 2.2 },
  titulo: { color: '#FFFFFF', fontWeight: '800' },
  tituloLargo: { fontSize: 46, lineHeight: 50, letterSpacing: -1.2 },
  tituloEstreito: { fontSize: 32, lineHeight: 37, letterSpacing: -0.8 },
  ficha: { flexDirection: 'row', alignItems: 'stretch', marginTop: 8, marginBottom: 4, flexWrap: 'wrap', rowGap: 12 },
  fichaEstreita: { flexWrap: 'nowrap', width: '100%', maxWidth: 420 },
  fichaItem: { gap: 6, paddingHorizontal: 2 },
  fichaColuna: { flex: 1, alignItems: 'center' },
  fichaDetalhe: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 },
  fichaDivisorEstreito: { marginHorizontal: 6 },
  fichaRotulo: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 1.2 },
  fichaConteudo: { minHeight: 22, justifyContent: 'center', alignItems: 'flex-start' },
  fichaValor: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  fichaDivisor: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.22)', marginHorizontal: 18 },
  sinopse: { color: 'rgba(255,255,255,0.86)', fontSize: 17, lineHeight: 26, marginTop: 6, maxWidth: 560 },
  aviso: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  corpo: { width: '100%', alignSelf: 'center', paddingTop: espaco.xxxl },
  secao: { marginBottom: espaco.xxxl, gap: espaco.l },
  secaoCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secaoTraco: { width: 4, height: 20, borderRadius: 2 },
  horarios: { flexDirection: 'row', flexWrap: 'wrap' },
  horario: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, gap: 6 },
});
