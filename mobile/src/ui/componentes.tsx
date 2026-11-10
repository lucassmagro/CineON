// Componentes visuais usados nas telas, no estilo das listas do iOS.
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores, espaco, fonte, raio } from './tema';

export function Tela({
  children,
  aoAtualizar,
  atualizando = false,
  rodape,
  semCabecalho = false,
}: {
  children: ReactNode;
  aoAtualizar?: () => void;
  atualizando?: boolean;
  rodape?: ReactNode;
  // telas sem header (as abas) precisam desviar do notch
  semCabecalho?: boolean;
}) {
  const margens = useSafeAreaInsets();
  return (
    <View style={estilos.tela}>
      <ScrollView
        contentContainerStyle={[estilos.conteudo, semCabecalho && { paddingTop: margens.top + espaco.l }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={aoAtualizar ? <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} /> : undefined}>
        {children}
      </ScrollView>
      {rodape ? <View style={estilos.rodapeFixo}>{rodape}</View> : null}
    </View>
  );
}

export function Grupo({ titulo, nota, children }: { titulo?: string; nota?: string; children: ReactNode }) {
  return (
    <View style={estilos.grupo}>
      {titulo ? <Text style={estilos.grupoTitulo}>{titulo.toUpperCase()}</Text> : null}
      <View style={estilos.cartao}>{children}</View>
      {nota ? <Text style={estilos.grupoNota}>{nota}</Text> : null}
    </View>
  );
}

export function Linha({
  titulo,
  subtitulo,
  valor,
  aoTocar,
  destaque,
  ultima = false,
  corTitulo,
}: {
  titulo: string;
  subtitulo?: string;
  valor?: string;
  aoTocar?: () => void;
  destaque?: ReactNode;
  ultima?: boolean;
  corTitulo?: string;
}) {
  const conteudo = (
    <View style={[estilos.linha, !ultima && estilos.linhaSeparada]}>
      <View style={{ flex: 1 }}>
        <Text style={[estilos.linhaTitulo, corTitulo ? { color: corTitulo } : null]} numberOfLines={2}>
          {titulo}
        </Text>
        {subtitulo ? <Text style={estilos.linhaSubtitulo}>{subtitulo}</Text> : null}
      </View>
      {destaque}
      {valor ? <Text style={estilos.linhaValor}>{valor}</Text> : null}
      {aoTocar ? <Text style={estilos.seta}>›</Text> : null}
    </View>
  );
  if (!aoTocar) return conteudo;
  return (
    <Pressable onPress={aoTocar} accessibilityRole="button" style={({ pressed }) => pressed && { backgroundColor: cores.separador }}>
      {conteudo}
    </Pressable>
  );
}

export function LinhaSwitch({ titulo, valor, aoMudar, ultima }: { titulo: string; valor: boolean; aoMudar: (v: boolean) => void; ultima?: boolean }) {
  return (
    <View style={[estilos.linha, !ultima && estilos.linhaSeparada]}>
      <Text style={[estilos.linhaTitulo, { flex: 1 }]}>{titulo}</Text>
      <Switch value={valor} onValueChange={aoMudar} trackColor={{ true: cores.verde }} />
    </View>
  );
}

export function Campo({
  rotulo,
  ultima,
  teclado,
  style,
  ...props
}: TextInputProps & { rotulo: string; ultima?: boolean; teclado?: KeyboardTypeOptions }) {
  return (
    <View style={[estilos.campo, !ultima && estilos.linhaSeparada]}>
      <Text style={estilos.campoRotulo}>{rotulo}</Text>
      <TextInput
        placeholderTextColor={cores.textoSecundario}
        keyboardType={teclado}
        accessibilityLabel={rotulo}
        style={[estilos.campoEntrada, props.multiline && { minHeight: 80, textAlignVertical: 'top' }, style]}
        {...props}
      />
    </View>
  );
}

type TipoBotao = 'primario' | 'secundario' | 'destrutivo';

export function Botao({
  titulo,
  aoTocar,
  tipo = 'primario',
  carregando = false,
  desabilitado = false,
  estilo,
}: {
  titulo: string;
  aoTocar: () => void;
  tipo?: TipoBotao;
  carregando?: boolean;
  desabilitado?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const inativo = desabilitado || carregando;
  const corTexto = tipo === 'primario' ? '#FFFFFF' : tipo === 'destrutivo' ? cores.vermelho : cores.azul;
  return (
    <Pressable
      onPress={aoTocar}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo }}
      style={({ pressed }) => [
        estilos.botao,
        tipo === 'primario' ? { backgroundColor: cores.azul } : { backgroundColor: cores.cartao },
        inativo && { opacity: 0.4 },
        pressed && { opacity: 0.7 },
        estilo,
      ]}>
      {carregando ? <ActivityIndicator color={corTexto} /> : <Text style={[estilos.botaoTexto, { color: corTexto }]}>{titulo}</Text>}
    </Pressable>
  );
}

export function Segmentos<T extends string>({
  opcoes,
  valor,
  aoMudar,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T | null;
  aoMudar: (v: T) => void;
}) {
  return (
    <View style={estilos.segmentos}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressable key={o.valor} onPress={() => aoMudar(o.valor)} style={[estilos.segmento, ativo && estilos.segmentoAtivo]}>
            <Text style={[estilos.segmentoTexto, ativo && { fontWeight: '600' }]}>{o.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chips<T extends string>({
  opcoes,
  valor,
  aoMudar,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T | null;
  aoMudar: (v: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco.s, paddingHorizontal: espaco.l }}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressable key={o.valor} onPress={() => aoMudar(o.valor)} style={[estilos.chip, ativo && { backgroundColor: cores.azul }]}>
            <Text style={[estilos.chipTexto, ativo && { color: '#FFFFFF' }]}>{o.rotulo}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Etiqueta({ texto, cor, fundo }: { texto: string; cor: string; fundo: string }) {
  return (
    <View style={[estilos.etiqueta, { backgroundColor: fundo }]}>
      <Text style={[estilos.etiquetaTexto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

export function TituloGrande({ texto, subtitulo }: { texto: string; subtitulo?: string }) {
  return (
    <View style={{ paddingHorizontal: espaco.l, marginBottom: espaco.m }}>
      <Text style={fonte.tituloGrande}>{texto}</Text>
      {subtitulo ? <Text style={[fonte.secundario, { color: cores.textoSecundario, marginTop: 2 }]}>{subtitulo}</Text> : null}
    </View>
  );
}

export function Carregando() {
  return (
    <View style={estilos.centro}>
      <ActivityIndicator size="large" color={cores.textoSecundario} />
    </View>
  );
}

export function MensagemErro({ mensagem, aoTentarDeNovo }: { mensagem: string; aoTentarDeNovo?: () => void }) {
  return (
    <View style={estilos.centro}>
      <Text style={[fonte.subtitulo, { textAlign: 'center' }]}>Não foi possível carregar</Text>
      <Text style={[fonte.secundario, { color: cores.textoSecundario, textAlign: 'center' }]}>{mensagem}</Text>
      {aoTentarDeNovo ? <Botao titulo="Tentar novamente" tipo="secundario" aoTocar={aoTentarDeNovo} /> : null}
    </View>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return (
    <View style={[estilos.centro, { paddingVertical: espaco.xxl }]}>
      <Text style={[fonte.secundario, { color: cores.textoSecundario, textAlign: 'center' }]}>{texto}</Text>
    </View>
  );
}

export function TextoErro({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return <Text style={estilos.textoErro}>{texto}</Text>;
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingTop: espaco.l, paddingBottom: espaco.xxl * 2 },
  rodapeFixo: {
    backgroundColor: cores.cartao,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cores.separador,
    padding: espaco.l,
    paddingBottom: espaco.xl,
    gap: espaco.s,
  },
  grupo: { marginBottom: espaco.xl, paddingHorizontal: espaco.l },
  grupoTitulo: { ...fonte.rodape, color: cores.textoSecundario, marginLeft: espaco.l, marginBottom: 6 },
  grupoNota: { ...fonte.rodape, color: cores.textoSecundario, marginHorizontal: espaco.l, marginTop: 6 },
  cartao: { backgroundColor: cores.cartao, borderRadius: raio.medio, overflow: 'hidden' },
  linha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: espaco.l, gap: espaco.s, minHeight: 44 },
  linhaSeparada: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.separador },
  linhaTitulo: { ...fonte.corpo, color: cores.texto },
  linhaSubtitulo: { ...fonte.secundario, color: cores.textoSecundario, marginTop: 2 },
  linhaValor: { ...fonte.corpo, color: cores.textoSecundario },
  seta: { fontSize: 22, color: cores.bordaAssento, marginLeft: 2 },
  campo: { paddingHorizontal: espaco.l, paddingVertical: 10 },
  campoRotulo: { ...fonte.rodape, color: cores.textoSecundario },
  // tira a borda de foco que o navegador coloca no input
  campoEntrada: { ...fonte.corpo, color: cores.texto, paddingVertical: 4, ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) },
  botao: { minHeight: 50, borderRadius: raio.medio, alignItems: 'center', justifyContent: 'center', paddingHorizontal: espaco.l },
  botaoTexto: { fontSize: 17, fontWeight: '600' },
  segmentos: { flexDirection: 'row', backgroundColor: '#E3E3E8', borderRadius: 9, padding: 2, margin: espaco.m },
  segmento: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 7 },
  segmentoAtivo: { backgroundColor: cores.cartao, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentoTexto: { fontSize: 14, color: cores.texto },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: cores.cartao },
  chipTexto: { fontSize: 15, color: cores.texto },
  etiqueta: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  etiquetaTexto: { fontSize: 12, fontWeight: '600' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaco.xl, gap: espaco.m, backgroundColor: cores.fundo },
  textoErro: { ...fonte.secundario, color: cores.vermelho, marginHorizontal: espaco.xl, marginBottom: espaco.m },
});
