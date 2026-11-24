// Componentes base das telas, no estilo do iOS.
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode, type RefObject } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AparecerTela, Pulso } from './animacoes';
import { ALTURA_BARRA_ABAS, useEspacoBarraAbas } from './BarraAbas';
import { BotaoTema } from './BotaoTema';
import { useReduzirMovimento } from './movimento';
import { espaco, larguraLeitura, raio, tipos, useEstilos, useMargem, useTema, type Paleta, type Tipo } from './tema';
import { Tocavel } from './Tocavel';

export type NomeIcone = ComponentProps<typeof Ionicons>['name'];

type CorTexto = 'rotulo' | 'secundario' | 'terciario' | 'azul' | 'vermelho' | 'verde' | 'laranja';

export function Texto({
  tipo = 'corpo',
  cor = 'rotulo',
  peso,
  style,
  ...props
}: TextProps & { tipo?: Tipo; cor?: CorTexto | (string & {}); peso?: TextStyle['fontWeight'] }) {
  const c = useTema();
  const mapa: Record<CorTexto, string> = {
    rotulo: c.rotulo,
    secundario: c.rotuloSecundario,
    terciario: c.rotuloTerciario,
    azul: c.azul,
    vermelho: c.vermelho,
    verde: c.verde,
    laranja: c.laranja,
  };
  const corFinal = (mapa as Record<string, string>)[cor] ?? cor;
  return <Text style={[tipos[tipo], { color: corFinal }, peso ? { fontWeight: peso } : null, style]} {...props} />;
}

export function Icone({ nome, tamanho = 22, cor }: { nome: NomeIcone; tamanho?: number; cor?: string }) {
  const c = useTema();
  return <Ionicons name={nome} size={tamanho} color={cor ?? c.rotulo} />;
}

// ícone branco num quadrado colorido, como no app Ajustes
export function IconeQuadrado({ nome, cor }: { nome: NomeIcone; cor: string }) {
  return (
    <View style={[estilosFixos.iconeQuadrado, { backgroundColor: cor }]}>
      <Ionicons name={nome} size={17} color="#FFFFFF" />
    </View>
  );
}

export function Tela({
  children,
  titulo,
  subtitulo,
  semCabecalho = false,
  aoAtualizar,
  atualizando = false,
  rodape,
  acaoTitulo,
  semBotaoTema = false,
  largura = larguraLeitura,
  refRolagem,
}: {
  children: ReactNode;
  titulo?: string;
  subtitulo?: string;
  semCabecalho?: boolean;
  aoAtualizar?: () => void;
  atualizando?: boolean;
  rodape?: ReactNode;
  acaoTitulo?: ReactNode;
  /** a Conta já tem a escolha de aparência, então não repete o botão */
  semBotaoTema?: boolean;
  /** largura máxima do conteúdo em telas grandes */
  largura?: number;
  /** pra tela rolar até um ponto (botões que levam a uma seção) */
  refRolagem?: RefObject<ScrollView | null>;
}) {
  const c = useTema();
  const margens = useSafeAreaInsets();
  const margem = useMargem();
  const [alturaRodape, setAlturaRodape] = useState(0);
  const espacoAbas = useEspacoBarraAbas();
  return (
    <View style={{ flex: 1, backgroundColor: c.fundo }}>
      <ScrollView
        ref={refRolagem}
        contentContainerStyle={{
          paddingTop: (semCabecalho ? margens.top : 0) + espaco.s,
          // telas sem cabeçalho são as das abas, e a pílula das abas flutua por cima do conteúdo
          paddingBottom: (rodape ? alturaRodape : semCabecalho ? espacoAbas + ALTURA_BARRA_ABAS : margens.bottom) + espaco.xxl,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={aoAtualizar ? <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={c.rotuloSecundario} /> : undefined}>
        <AparecerTela style={{ width: '100%', maxWidth: largura, alignSelf: 'center' }}>
        {titulo ? (
          <View style={[estilosFixos.tituloGrande, { paddingHorizontal: margem }]}>
            <View style={{ flex: 1 }}>
              <Texto tipo="tituloGrande">{titulo}</Texto>
              {subtitulo ? (
                <Texto tipo="subtitulo" cor="secundario" style={{ marginTop: 2 }}>
                  {subtitulo}
                </Texto>
              ) : null}
            </View>
            {/* nas telas das abas, o botão de tema fica ao lado do título */}
            <View style={{ paddingTop: 6 }}>{acaoTitulo ?? (semCabecalho && !semBotaoTema ? <BotaoTema /> : null)}</View>
          </View>
        ) : null}
        {children}
        </AparecerTela>
      </ScrollView>
      {rodape ? (
        <BarraInferior aoMedir={setAlturaRodape} margemInferior={margens.bottom} margem={margem}>
          {rodape}
        </BarraInferior>
      ) : null}
    </View>
  );
}

// barra translúcida que fica por cima do conteúdo, como as do iOS
function BarraInferior({ children, aoMedir, margemInferior, margem }: { children: ReactNode; aoMedir: (h: number) => void; margemInferior: number; margem: number }) {
  const c = useTema();
  return (
    <View style={estilosFixos.barraInferior} onLayout={(e) => aoMedir(e.nativeEvent.layout.height)}>
      <BlurView
        intensity={Platform.OS === 'android' ? 0 : 80}
        tint={c.escuro ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: c.fundoElevado }]}
      />
      <View style={[estilosFixos.barraBorda, { backgroundColor: c.separador }]} />
      <View style={{ paddingHorizontal: margem, paddingTop: espaco.m, paddingBottom: Math.max(margemInferior, espaco.l), gap: espaco.s, width: '100%', maxWidth: larguraLeitura, alignSelf: 'center' }}>
        {children}
      </View>
    </View>
  );
}

export function Secao({ titulo, nota, children, estilo }: { titulo?: string; nota?: string; children: ReactNode; estilo?: StyleProp<ViewStyle> }) {
  const s = useEstilos(criarEstilos);
  const margem = useMargem();
  return (
    <View style={[s.secao, { paddingHorizontal: margem }, estilo]}>
      {titulo ? (
        <Texto tipo="destaque" style={s.secaoTitulo}>
          {titulo}
        </Texto>
      ) : null}
      <View style={s.cartao}>{children}</View>
      {nota ? (
        <Texto tipo="nota" cor="secundario" style={s.secaoNota}>
          {nota}
        </Texto>
      ) : null}
    </View>
  );
}

type Acessorio = 'seta' | 'check' | 'nenhum';

export function Linha({
  titulo,
  subtitulo,
  valor,
  icone,
  esquerda,
  direita,
  acessorio,
  aoTocar,
  destrutivo = false,
  ultima = false,
  corTitulo,
}: {
  titulo: string;
  subtitulo?: string;
  valor?: string;
  icone?: { nome: NomeIcone; cor: string };
  esquerda?: ReactNode;
  direita?: ReactNode;
  acessorio?: Acessorio;
  aoTocar?: () => void;
  destrutivo?: boolean;
  ultima?: boolean;
  corTitulo?: string;
}) {
  const c = useTema();
  const s = useEstilos(criarEstilos);
  const acc: Acessorio = acessorio ?? (aoTocar ? 'seta' : 'nenhum');
  const conteudo = (
    <View style={s.linha}>
      {icone ? <IconeQuadrado nome={icone.nome} cor={icone.cor} /> : esquerda}
      <View style={s.linhaMeio}>
        <View style={{ flex: 1, paddingVertical: subtitulo ? 10 : 12 }}>
          <Texto numberOfLines={2} cor={destrutivo ? 'vermelho' : (corTitulo ?? 'rotulo')}>
            {titulo}
          </Texto>
          {subtitulo ? (
            <Texto tipo="subtitulo" cor="secundario" numberOfLines={2} style={{ marginTop: 1 }}>
              {subtitulo}
            </Texto>
          ) : null}
        </View>
        {direita}
        {valor ? (
          <Texto cor="secundario" numberOfLines={1} style={{ maxWidth: '55%', textAlign: 'right' }}>
            {valor}
          </Texto>
        ) : null}
        {acc === 'seta' ? <Ionicons name="chevron-forward" size={17} color={c.rotuloTerciario} /> : null}
        {acc === 'check' ? <Ionicons name="checkmark" size={20} color={c.azul} /> : null}
        {/* a linha divisória começa depois do ícone, como no iOS */}
        {!ultima ? <View style={s.separador} /> : null}
      </View>
    </View>
  );
  if (!aoTocar) return conteudo;
  // linha de lista não encolhe: acende o fundo e apaga devagar, como no iOS
  return (
    <Tocavel onPress={aoTocar} escala={1} realce={c.preenchimento} vibracao={destrutivo ? 'media' : 'leve'} accessibilityRole="button" accessibilityLabel={titulo}>
      {conteudo}
    </Tocavel>
  );
}

export function LinhaSwitch({ titulo, valor, aoMudar, ultima }: { titulo: string; valor: boolean; aoMudar: (v: boolean) => void; ultima?: boolean }) {
  const c = useTema();
  const s = useEstilos(criarEstilos);
  return (
    <View style={s.linha}>
      <View style={[s.linhaMeio, { minHeight: 46 }]}>
        <Texto style={{ flex: 1 }}>{titulo}</Texto>
        <Switch value={valor} onValueChange={aoMudar} trackColor={{ true: c.verde, false: c.preenchimentoForte }} />
        {!ultima ? <View style={s.separador} /> : null}
      </View>
    </View>
  );
}

export function Campo({
  rotulo,
  ultima,
  ocultarRotulo = false,
  style,
  ...props
}: TextInputProps & { rotulo: string; ultima?: boolean; ocultarRotulo?: boolean }) {
  const c = useTema();
  const s = useEstilos(criarEstilos);
  return (
    <View style={s.linha}>
      <View style={[s.linhaMeio, { minHeight: 46 }]}>
        {ocultarRotulo ? null : <Texto style={{ width: 112 }}>{rotulo}</Texto>}
        <TextInput
          placeholderTextColor={c.rotuloTerciario}
          accessibilityLabel={rotulo}
          style={[tipos.corpo, s.campoEntrada, props.multiline && { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 }, style]}
          {...props}
        />
        {!ultima ? <View style={s.separador} /> : null}
      </View>
    </View>
  );
}

// contador com - e + (UIStepper)
export function Contador({
  rotulo,
  valor,
  aoMudar,
  minimo,
  maximo,
  detalhe,
  ultima,
}: {
  rotulo: string;
  valor: number;
  aoMudar: (v: number) => void;
  minimo: number;
  maximo: number;
  detalhe?: string;
  ultima?: boolean;
}) {
  const c = useTema();
  const s = useEstilos(criarEstilos);
  const botao = (sinal: 1 | -1) => {
    const desabilitado = sinal < 0 ? valor <= minimo : valor >= maximo;
    return (
      <Tocavel
        onPress={() => aoMudar(Math.min(maximo, Math.max(minimo, valor + sinal)))}
        disabled={desabilitado}
        escala={1}
        realce={c.preenchimentoForte}
        vibracao="selecao"
        accessibilityRole="button"
        accessibilityLabel={`${sinal < 0 ? 'Diminuir' : 'Aumentar'} ${rotulo}`}
        style={[s.contadorBotao, desabilitado && { opacity: 0.35 }]}>
        <Ionicons name={sinal < 0 ? 'remove' : 'add'} size={20} color={c.rotulo} />
      </Tocavel>
    );
  };
  return (
    <View style={s.linha}>
      <View style={[s.linhaMeio, { minHeight: 52 }]}>
        <View style={{ flex: 1 }}>
          <Texto>{rotulo}</Texto>
          {detalhe ? (
            <Texto tipo="nota" cor="secundario">
              {detalhe}
            </Texto>
          ) : null}
        </View>
        <Pulso chave={valor} style={{ minWidth: 34 }}>
          <Texto tipo="destaque" style={{ textAlign: 'center', fontVariant: ['tabular-nums'] }}>
            {valor}
          </Texto>
        </Pulso>
        <View style={s.contador}>
          {botao(-1)}
          <View style={[s.contadorDivisor, { backgroundColor: c.separador }]} />
          {botao(1)}
        </View>
        {!ultima ? <View style={s.separador} /> : null}
      </View>
    </View>
  );
}

type Variante = 'preenchido' | 'tingido' | 'simples' | 'destrutivo';

export function Botao({
  titulo,
  aoTocar,
  variante = 'preenchido',
  cor,
  corTexto,
  icone,
  carregando = false,
  desabilitado = false,
  compacto = false,
  estilo,
}: {
  titulo: string;
  aoTocar: () => void;
  variante?: Variante;
  cor?: string;
  corTexto?: string;
  icone?: NomeIcone;
  carregando?: boolean;
  desabilitado?: boolean;
  compacto?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const c = useTema();
  const base = cor ?? c.azul;
  const fundo =
    variante === 'preenchido' ? base : variante === 'tingido' ? c.preenchimento : 'transparent';
  const texto =
    corTexto ?? (variante === 'preenchido' ? '#FFFFFF' : variante === 'destrutivo' ? c.vermelho : base);
  const inativo = desabilitado || carregando;
  return (
    <Tocavel
      onPress={aoTocar}
      disabled={inativo}
      escala={compacto ? 0.94 : 0.97}
      escalaHover={1.015}
      vibracao={variante === 'destrutivo' ? 'media' : 'leve'}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      estiloPressionado={{ opacity: 0.82 }}
      style={[estilosFixos.botao, compacto && estilosFixos.botaoCompacto, { backgroundColor: fundo }, inativo && { opacity: 0.4 }, estilo]}>
      {carregando ? (
        <ActivityIndicator color={texto} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {icone ? <Ionicons name={icone} size={compacto ? 17 : 19} color={texto} /> : null}
          <Text style={[compacto ? tipos.subtitulo : tipos.destaque, { color: texto, fontWeight: '600' }]}>{titulo}</Text>
        </View>
      )}
    </Tocavel>
  );
}

// controle segmentado do iOS: a pílula clara desliza até a opção escolhida
export function Segmentos<T extends string>({
  opcoes,
  valor,
  aoMudar,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T | null;
  aoMudar: (v: T) => void;
}) {
  const c = useTema();
  const reduzir = useReduzirMovimento();
  const [largura, setLargura] = useState(0);
  const indice = opcoes.findIndex((o) => o.valor === valor);
  const larguraSegmento = largura > 0 ? (largura - 4) / opcoes.length : 0;
  const posicao = useSharedValue(0);
  const visivel = useSharedValue(indice >= 0 ? 1 : 0);
  const jaPosicionou = useRef(false);

  useEffect(() => {
    if (!larguraSegmento) return;
    const destino = Math.max(0, indice) * larguraSegmento;
    // na primeira medida só coloca no lugar, sem deslizar
    if (reduzir || !jaPosicionou.current) posicao.set(destino);
    else posicao.set(withSpring(destino, { damping: 28, stiffness: 300, mass: 0.8 }));
    jaPosicionou.current = true;
    visivel.set(withTiming(indice >= 0 ? 1 : 0, { duration: 160 }));
  }, [indice, larguraSegmento, reduzir, posicao, visivel]);

  const estiloPilula = useAnimatedStyle(() => ({ transform: [{ translateX: posicao.get() }], opacity: visivel.get() }));

  return (
    <View
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      style={[estilosFixos.segmentos, { backgroundColor: c.preenchimento }]}
      accessibilityRole="tablist">
      {larguraSegmento > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[estilosFixos.pilula, { width: larguraSegmento, backgroundColor: c.escuro ? '#636366' : '#FFFFFF' }, estiloPilula]}
        />
      ) : null}
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Tocavel
            key={o.valor}
            onPress={() => aoMudar(o.valor)}
            escala={0.94}
            vibracao="selecao"
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            style={estilosFixos.segmento}>
            <Texto tipo="nota" peso={ativo ? '600' : '500'}>
              {o.rotulo}
            </Texto>
          </Tocavel>
        );
      })}
    </View>
  );
}

export function Etiqueta({ texto, cor, icone }: { texto: string; cor: string; icone?: NomeIcone }) {
  return (
    <View style={[estilosFixos.etiqueta, { backgroundColor: cor + '22' }]}>
      {icone ? <Ionicons name={icone} size={12} color={cor} /> : null}
      <Text style={[tipos.legenda, { color: cor, fontWeight: '600' }]}>{texto}</Text>
    </View>
  );
}

export function Carregando() {
  const c = useTema();
  return (
    <View style={[estilosFixos.centro, { backgroundColor: c.fundo }]}>
      <ActivityIndicator color={c.rotuloSecundario} />
    </View>
  );
}

export function Vazio({ icone, titulo, texto, acao }: { icone: NomeIcone; titulo: string; texto?: string; acao?: ReactNode }) {
  const c = useTema();
  return (
    <View style={estilosFixos.vazio}>
      <Ionicons name={icone} size={44} color={c.rotuloTerciario} />
      <Texto tipo="titulo3" style={{ textAlign: 'center' }}>
        {titulo}
      </Texto>
      {texto ? (
        <Texto tipo="subtitulo" cor="secundario" style={{ textAlign: 'center', maxWidth: 300 }}>
          {texto}
        </Texto>
      ) : null}
      {acao}
    </View>
  );
}

export function MensagemErro({ mensagem, aoTentarDeNovo }: { mensagem: string; aoTentarDeNovo?: () => void }) {
  const c = useTema();
  return (
    <View style={[estilosFixos.centro, { backgroundColor: c.fundo }]}>
      <Vazio
        icone="cloud-offline-outline"
        titulo="Não foi possível carregar"
        texto={mensagem}
        acao={aoTentarDeNovo ? <Botao titulo="Tentar de novo" variante="tingido" compacto aoTocar={aoTentarDeNovo} /> : undefined}
      />
    </View>
  );
}

export function TextoErro({ texto }: { texto: string | null }) {
  const c = useTema();
  const margem = useMargem();
  if (!texto) return null;
  return (
    <View style={[estilosFixos.erroLinha, { marginHorizontal: margem + espaco.xs }]}>
      <Ionicons name="alert-circle" size={16} color={c.vermelho} />
      <Texto tipo="nota" cor="vermelho" style={{ flex: 1 }}>
        {texto}
      </Texto>
    </View>
  );
}

const estilosFixos = StyleSheet.create({
  tituloGrande: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: espaco.xl, marginTop: espaco.xs, gap: espaco.m },
  barraInferior: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  barraBorda: { position: 'absolute', top: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth },
  iconeQuadrado: { width: 29, height: 29, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  botao: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: espaco.xl },
  botaoCompacto: { minHeight: 36, borderRadius: raio.pilula, paddingHorizontal: espaco.l },
  segmentos: { flexDirection: 'row', borderRadius: 9, padding: 2 },
  segmento: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 7 },
  pilula: { position: 'absolute', top: 2, bottom: 2, left: 2, borderRadius: 7, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  etiqueta: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaco.xxl },
  vazio: { alignItems: 'center', justifyContent: 'center', gap: espaco.s, paddingVertical: espaco.xxxl * 1.5, paddingHorizontal: espaco.xxl },
  erroLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: espaco.m },
});

function criarEstilos(c: Paleta) {
  return StyleSheet.create({
    secao: { marginBottom: espaco.xxl },
    secaoTitulo: { marginLeft: espaco.xs, marginBottom: espaco.s, letterSpacing: -0.3 },
    secaoNota: { marginHorizontal: espaco.l, marginTop: 7 },
    cartao: { backgroundColor: c.fundoElevado, borderRadius: raio.medio, overflow: 'hidden' },
    linha: { flexDirection: 'row', alignItems: 'center', paddingLeft: espaco.l, gap: espaco.m, minHeight: 46 },
    linhaMeio: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: espaco.s, paddingRight: espaco.l, alignSelf: 'stretch' },
    separador: { position: 'absolute', bottom: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: c.separador },
    campoEntrada: {
      flex: 1,
      color: c.rotulo,
      paddingVertical: 11,
      ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
    },
    contador: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.preenchimento, borderRadius: 8, overflow: 'hidden' },
    contadorBotao: { width: 46, height: 32, alignItems: 'center', justifyContent: 'center' },
    contadorDivisor: { width: StyleSheet.hairlineWidth, height: 18 },
  });
}
