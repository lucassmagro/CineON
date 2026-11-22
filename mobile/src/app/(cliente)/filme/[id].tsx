import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Arte } from '@/components/Arte';
import { SeloClassificacao, textoClassificacao } from '@/components/SeloClassificacao';
import { SeletorDia } from '@/components/SeletorDia';
import { Trailer, type ControleTrailer } from '@/components/Trailer';
import { serifa } from '@/components/trailer/base';
import { useCarregar } from '@/hooks/useCarregar';
import { urlArquivo } from '@/services/api';
import { filmeService } from '@/services/cineon';
import { Surgir } from '@/ui/animacoes';
import { Carregando, Icone, MensagemErro, Tela, Texto, Vazio } from '@/ui/componentes';
import { paletaDoFilme } from '@/ui/coresPoster';
import { roteiroDoFilme } from '@/ui/roteirosTrailer';
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
  const rolagem = useRef<ScrollView>(null);
  // onde cada parte começa dentro da rolagem, pros botões lá de cima
  const [fimAbertura, setFimAbertura] = useState(0);
  const [posicoes, setPosicoes] = useState({ trailer: 0, sessoes: 0 });
  const trailer = useRef<ControleTrailer>(null);

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
  const roteiro = roteiroDoFilme(filme);
  const poster = urlArquivo(filme.posterUrl);
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
  const alinhar = larga ? 'left' : 'center';

  function irPara(y: number) {
    rolagem.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  }

  return (
    <Tela largura={100000} refRolagem={rolagem}>
      <StatusBar style="light" />

      {/* abertura na cor do pôster, com o próprio pôster desfocado por baixo */}
      <View style={[estilos.abertura, { backgroundColor: paleta.fundo }]} onLayout={(e) => setFimAbertura(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
        {/* cobre o "puxar além do topo" no iOS com a mesma cor */}
        <View style={[estilos.acimaDoTopo, { backgroundColor: paleta.fundo }]} />
        {poster ? (
          <View style={estilos.textura} pointerEvents="none">
            <Image source={{ uri: poster }} style={estilos.texturaImagem} resizeMode="cover" blurRadius={40} accessibilityIgnoresInvertColors />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: paleta.fundo, opacity: 0.8 }]} />
          </View>
        ) : null}

        <View style={[estilos.aberturaConteudo, { paddingHorizontal: margem, maxWidth: LARGURA_ABERTURA }, larga ? estilos.aberturaLarga : estilos.aberturaEstreita]}>
          <Surgir indice={0}>
            <View style={estilos.sombraPoster}>
              <Arte titulo={filme.titulo} id={filme.id} poster={filme.posterUrl} estilo={{ width: larguraPoster, borderRadius: 14 }} />
            </View>
          </Surgir>

          <Surgir indice={2} style={[estilos.info, larga ? null : estilos.infoCentro]}>
            <Text style={[estilos.genero, { color: paleta.destaque }]}>{filme.genero.toUpperCase()}</Text>
            <Text style={[estilos.titulo, larga ? estilos.tituloLargo : estilos.tituloEstreito, { textAlign: alinhar }]}>{filme.titulo}</Text>
            {roteiro.tagline ? <Text style={[serifa, estilos.tagline, { textAlign: alinhar }]}>{roteiro.tagline}</Text> : null}

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

            {filme.sinopse ? <Text style={[estilos.sinopse, { textAlign: alinhar }]}>{filme.sinopse}</Text> : null}

            <View style={[estilos.botoes, larga ? null : { justifyContent: 'center' }]}>
              <Tocavel
                onPress={() => {
                  irPara(fimAbertura + posicoes.trailer);
                  trailer.current?.tocarDoComeco();
                }}
                escala={0.95}
                escalaHover={1.03}
                accessibilityRole="button"
                accessibilityLabel={`Assistir ao trailer de ${filme.titulo}`}
                style={[estilos.botao, { backgroundColor: paleta.destaque }]}>
                <Icone nome="play" tamanho={17} cor={paleta.sobreDestaque} />
                <Text style={[estilos.botaoTexto, { color: paleta.sobreDestaque }]}>Assistir ao trailer</Text>
              </Tocavel>
              {dias.length > 0 ? (
                <Tocavel
                  onPress={() => irPara(fimAbertura + posicoes.sessoes)}
                  escala={0.95}
                  escalaHover={1.03}
                  accessibilityRole="button"
                  accessibilityLabel="Ver as sessões"
                  style={[estilos.botao, estilos.botaoVazado]}>
                  <Icone nome="calendar-outline" tamanho={17} cor="#FFFFFF" />
                  <Text style={[estilos.botaoTexto, { color: '#FFFFFF' }]}>Ver sessões</Text>
                </Tocavel>
              ) : null}
            </View>

            <Text style={[estilos.aviso, { textAlign: alinhar }]}>{textoClassificacao(filme.classificacao)}</Text>
          </Surgir>
        </View>
      </View>

      {/* no desktop o corpo começa na mesma margem do pôster */}
      <View style={[estilos.corpo, { maxWidth: larga ? LARGURA_ABERTURA : larguraLeitura }]}>
        <Secao titulo="Trailer" nota="30 s" cor={paleta.destaque} margem={margem} aoMedir={(y) => setPosicoes((p) => ({ ...p, trailer: y }))}>
          <View style={{ paddingHorizontal: margem }}>
            <Trailer filme={filme} largura={larguraTrailer} paleta={paleta} controle={trailer} />
          </View>
        </Secao>

        <Secao
          titulo="Sessões"
          cor={paleta.destaque}
          margem={margem}
          nota={dias.length > 0 ? `${filme.sessoes.length} nos próximos dias` : undefined}
          aoMedir={(y) => setPosicoes((p) => ({ ...p, sessoes: y }))}>
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
function Secao({
  titulo,
  nota,
  cor,
  margem,
  aoMedir,
  children,
}: {
  titulo: string;
  nota?: string;
  cor: string;
  margem: number;
  aoMedir: (y: number) => void;
  children: ReactNode;
}) {
  return (
    <View style={estilos.secao} onLayout={(e) => aoMedir(e.nativeEvent.layout.y)}>
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
  abertura: { marginTop: -espaco.s, paddingTop: espaco.l, paddingBottom: espaco.xxxl + espaco.s, width: '100%', overflow: 'hidden' },
  acimaDoTopo: { position: 'absolute', left: 0, right: 0, top: -800, height: 800 },
  textura: { ...StyleSheet.absoluteFill },
  texturaImagem: { ...StyleSheet.absoluteFill, transform: [{ scale: 1.4 }] },
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
  tagline: { color: 'rgba(255,255,255,0.78)', fontSize: 19, lineHeight: 25, fontStyle: 'italic', marginTop: -2 },
  ficha: { flexDirection: 'row', alignItems: 'stretch', marginTop: 8, marginBottom: 4, flexWrap: 'wrap', rowGap: 12 },
  fichaEstreita: { flexWrap: 'nowrap', width: '100%', maxWidth: 420 },
  fichaItem: { gap: 6, paddingHorizontal: 2 },
  fichaColuna: { flex: 1, alignItems: 'center' },
  fichaRotulo: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 1.2 },
  fichaConteudo: { minHeight: 22, justifyContent: 'center', alignItems: 'flex-start' },
  fichaValor: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  fichaDetalhe: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 },
  fichaDivisor: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.22)', marginHorizontal: 18 },
  fichaDivisorEstreito: { marginHorizontal: 6 },
  sinopse: { color: 'rgba(255,255,255,0.86)', fontSize: 17, lineHeight: 26, marginTop: 6, maxWidth: 560 },
  botoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  botao: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999 },
  botaoVazado: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.35)' },
  botaoTexto: { fontSize: 16, fontWeight: '700' },
  aviso: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4 },
  corpo: { width: '100%', alignSelf: 'center', paddingTop: espaco.xxxl },
  secao: { marginBottom: espaco.xxxl, gap: espaco.l },
  secaoCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secaoTraco: { width: 4, height: 20, borderRadius: 2 },
  horarios: { flexDirection: 'row', flexWrap: 'wrap' },
  horario: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, gap: 6 },
});
