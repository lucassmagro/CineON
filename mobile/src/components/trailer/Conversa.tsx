// Estilo "conversa" (comédia): uma troca de mensagens com o "digitando…", balões subindo
// como num app de chat, depois o rosto do robô e a frase final em serifa.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Aparece, Cena, cheio, Fecho, Ficha, mola, prog, serifa, Surge, suave, type PropsEstilo } from './base';

const ABRE = [0, 2600] as const;
const CHAT = [2600, 17000] as const;
const ROSTO = [17000, 22000] as const;
const TIT = [22000, 27000] as const;
const GAP = 10;

type Mensagem = { quem: 'eu' | 'bot' | 'digitando'; texto?: string; ini: number; fim?: number };

export function Conversa({ t, m, largura, altura, filme, roteiro, paleta }: PropsEstilo) {
  const g = Math.round(Math.min(44, Math.max(22, largura * 0.06)));
  const azul = paleta.destaque;
  const { frases } = roteiro;
  const msgs: Mensagem[] = [
    { quem: 'eu', texto: roteiro.pergunta ?? 'Posso te pedir uma coisa?', ini: 3000 },
    { quem: 'digitando', ini: 4000, fim: 5300 },
    { quem: 'bot', texto: frases[0], ini: 5300 },
    { quem: 'digitando', ini: 6300, fim: 7600 },
    { quem: 'bot', texto: frases[1], ini: 7600 },
    { quem: 'eu', texto: roteiro.replica ?? 'Tem certeza?', ini: 9400 },
    { quem: 'digitando', ini: 10400, fim: 12000 },
    { quem: 'bot', texto: frases[2], ini: 12000 },
  ];
  const fonte = Math.max(12, Math.min(19, largura * 0.03));

  return (
    <>
      <Cena t={t} janela={ABRE} fundo={paleta.fundo}>
        <View style={[cheio, estilos.centro, { gap: altura * 0.08 }]}>
          <Pontinhos t={t} cor="rgba(255,255,255,0.85)" tamanho={Math.max(8, g * 0.3)} />
          <Aparece t={t} ini={1100}>
            <View style={estilos.sistema}>
              <Text style={estilos.sistemaTexto}>CINEON APRESENTA</Text>
            </View>
          </Aparece>
        </View>
      </Cena>

      <Cena t={t} janela={CHAT} fundo={paleta.fundo}>
        {/* os balões que sobem passam por baixo da barra do topo e somem */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: Math.max(34, altura * 0.13), overflow: 'hidden' }}>
          <Conversinha t={t} m={m} msgs={msgs} largura={Math.min(largura * 0.78, 560)} fonte={fonte} azul={azul} texto={paleta.sobreDestaque} />
        </View>
        <View style={[estilos.topo, { height: Math.max(34, altura * 0.13) }]}>
          <View style={[estilos.avatar, { backgroundColor: '#2C2C2E' }]}>
            <View style={[estilos.olhinho, { backgroundColor: azul }]} />
            <View style={[estilos.olhinho, { backgroundColor: azul }]} />
          </View>
          <View>
            <Text style={estilos.nome}>Padrinho</Text>
            <Text style={estilos.online}>online</Text>
          </View>
        </View>
      </Cena>

      <Cena t={t} janela={ROSTO}>
        <View style={[cheio, estilos.centro, { gap: altura * 0.07, paddingHorizontal: largura * 0.08 }]}>
          <Rosto t={t} ini={ROSTO[0]} tamanho={altura * 0.34} azul={azul} m={m} />
          <Surge t={t} ini={ROSTO[0] + 900} m={m} modo="lento" texto={frases[3]} estilo={[serifa, estilos.frase, { fontSize: g * 0.95, lineHeight: g * 1.2 }]} />
        </View>
      </Cena>

      <Cena t={t} janela={TIT} fundo="#0E0F10">
        <View style={[cheio, estilos.centro, { gap: altura * 0.045, paddingHorizontal: largura * 0.08 }]}>
          <Aparece t={t} ini={TIT[0] + 200}>
            <Text style={[estilos.rotulo, { color: azul }]}>UMA PRODUÇÃO CINEON</Text>
          </Aparece>
          <Fio t={t} ini={TIT[0] + 300} largura={largura * 0.2} />
          <Surge t={t} ini={TIT[0] + 500} m={m} modo="lento" texto={filme.titulo} estilo={[serifa, estilos.titulo, { fontSize: g * 1.4, lineHeight: g * 1.55 }]} />
          <Fio t={t} ini={TIT[0] + 300} largura={largura * 0.2} />
          <Aparece t={t} ini={TIT[0] + 1900}>
            <Ficha filme={filme} tamanho={Math.max(12, g * 0.36)} />
          </Aparece>
        </View>
      </Cena>

      <Fecho t={t} largura={largura} cor={azul} fundo="#0E0F10" fonte={{ ...serifa, fontWeight: '400', letterSpacing: 0 }} />
    </>
  );
}

// os balões ficam presos embaixo; cada um que chega empurra os anteriores pra cima
function Conversinha({ t, m, msgs, largura, fonte, azul, texto }: { t: SharedValue<number>; m: number; msgs: Mensagem[]; largura: number; fonte: number; azul: string; texto: string }) {
  const [alturas, setAlturas] = useState<number[]>(() => msgs.map(() => 40));
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center' }]}>
      <View style={{ position: 'absolute', bottom: '8%', width: largura }}>
        {msgs.map((msg, k) => (
          <Balao
            key={k}
            k={k}
            t={t}
            m={m}
            msgs={msgs}
            alturas={alturas}
            msg={msg}
            fonte={fonte}
            azul={azul}
            texto={texto}
            aoMedir={(h) => setAlturas((atual) => (atual[k] === h ? atual : atual.map((x, i) => (i === k ? h : x))))}
          />
        ))}
      </View>
    </View>
  );
}

function presenca(v: number, msg: Mensagem): number {
  'worklet';
  const entra = prog(v, msg.ini, msg.ini + 260);
  const sai = msg.fim === undefined ? 0 : prog(v, msg.fim, msg.fim + 150);
  return entra * (1 - sai);
}

function Balao({
  k,
  t,
  m,
  msgs,
  alturas,
  msg,
  fonte,
  azul,
  texto,
  aoMedir,
}: {
  k: number;
  t: SharedValue<number>;
  m: number;
  msgs: Mensagem[];
  alturas: number[];
  msg: Mensagem;
  fonte: number;
  azul: string;
  texto: string;
  aoMedir: (h: number) => void;
}) {
  const meu = msg.quem === 'eu';
  const a = useAnimatedStyle(() => {
    const v = t.get();
    // quanto as mensagens depois desta já empurraram ela pra cima
    let empurrao = 0;
    for (let j = k + 1; j < msgs.length; j++) {
      empurrao += ((alturas[j] ?? 40) + GAP) * suave(presenca(v, msgs[j]!));
    }
    const p = presenca(v, msg);
    return {
      opacity: p,
      transform: [{ translateY: -empurrao },{ scale: 0.85 + 0.15 * (m ? mola(Math.min(1, p)) : 1) }],
    };
  });
  return (
    <Animated.View
      onLayout={(e) => aoMedir(e.nativeEvent.layout.height)}
      style={[{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: meu ? 'flex-end' : 'flex-start', transformOrigin: meu ? 'right bottom' : 'left bottom' }, a]}>
      {msg.quem === 'digitando' ? (
        <View style={[estilos.balao, estilos.balaoBot]}>
          <Pontinhos t={t} cor="rgba(255,255,255,0.7)" tamanho={7} />
        </View>
      ) : (
        <View style={[estilos.balao, meu ? { backgroundColor: azul, borderBottomRightRadius: 4 } : estilos.balaoBot]}>
          <Text style={{ color: meu ? texto : '#FFFFFF', fontSize: fonte, lineHeight: Math.round(fonte * 1.3) }}>{msg.texto}</Text>
        </View>
      )}
    </Animated.View>
  );
}

function Pontinhos({ t, cor, tamanho }: { t: SharedValue<number>; cor: string; tamanho: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: tamanho * 0.6, paddingVertical: 4 }}>
      {[0, 1, 2].map((i) => (
        <Pontinho key={i} i={i} t={t} cor={cor} tamanho={tamanho} />
      ))}
    </View>
  );
}

function Pontinho({ i, t, cor, tamanho }: { i: number; t: SharedValue<number>; cor: string; tamanho: number }) {
  const a = useAnimatedStyle(() => {
    const fase = ((t.get() / 600 - i * 0.18) % 1 + 1) % 1;
    const pulo = fase < 0.5 ? Math.sin(fase * Math.PI * 2) : 0;
    return { opacity: 0.4 + 0.6 * pulo, transform: [{ translateY: -pulo * tamanho * 0.6 }] };
  });
  return <Animated.View style={[{ width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: cor }, a]} />;
}

// cabeça do robô com dois olhos azuis que piscam de vez em quando
function Rosto({ t, ini, tamanho, azul, m }: { t: SharedValue<number>; ini: number; tamanho: number; azul: string; m: number }) {
  const cabeca = useAnimatedStyle(() => {
    const p = suave(prog(t.get(), ini, ini + 900));
    return { opacity: p, transform: [{ scale: 0.9 + 0.1 * p }] };
  });
  const olhos = useAnimatedStyle(() => {
    const ciclo = (t.get() - ini) % 2600;
    const piscando = m && ciclo > 2400 ? 0.12 : 1;
    return { transform: [{ scaleY: piscando }] };
  });
  const brilho = useAnimatedStyle(() => ({ opacity: 0.18 + 0.1 * Math.sin(t.get() / 400) * m }));
  return (
    <Animated.View style={[{ width: tamanho * 1.25, height: tamanho, borderRadius: tamanho * 0.28, backgroundColor: '#2A2D31', alignItems: 'center', justifyContent: 'center' }, cabeca]}>
      <Animated.View style={[{ position: 'absolute', width: tamanho * 0.9, height: tamanho * 0.4, borderRadius: tamanho * 0.2, backgroundColor: azul }, brilho]} />
      <Animated.View style={[{ flexDirection: 'row', gap: tamanho * 0.26 }, olhos]}>
        <View style={{ width: tamanho * 0.24, height: tamanho * 0.13, borderRadius: tamanho * 0.06, backgroundColor: azul }} />
        <View style={{ width: tamanho * 0.24, height: tamanho * 0.13, borderRadius: tamanho * 0.06, backgroundColor: azul }} />
      </Animated.View>
    </Animated.View>
  );
}

function Fio({ t, ini, largura }: { t: SharedValue<number>; ini: number; largura: number }) {
  const a = useAnimatedStyle(() => ({ transform: [{ scaleX: suave(prog(t.get(), ini, ini + 1200)) }] }));
  return <Animated.View style={[{ width: largura, height: 1, backgroundColor: 'rgba(255,255,255,0.4)' }, a]} />;
}

const estilos = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  sistema: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' },
  sistemaTexto: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 2.5 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(0,0,0,0.25)' },
  avatar: { width: 28, height: 28, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  olhinho: { width: 6, height: 4, borderRadius: 2 },
  nome: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  online: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  balao: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  balaoBot: { backgroundColor: '#2C2C2E', borderBottomLeftRadius: 4 },
  frase: { color: '#FFFFFF', fontStyle: 'italic', textAlign: 'center' },
  titulo: { color: '#FFFFFF', textAlign: 'center' },
  rotulo: { fontSize: 11, fontWeight: '700', letterSpacing: 3.5 },
});
