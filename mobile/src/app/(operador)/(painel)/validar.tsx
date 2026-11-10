import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import type { Ingresso } from '@/models/tipos';
import { ErroApi, mensagemDe } from '@/services/api';
import { ingressoService } from '@/services/cineon';
import { Botao, Tela, Texto } from '@/ui/componentes';
import { espaco, fonteCodigo, useMargem, useTema } from '@/ui/tema';
import { dataHora, hora } from '@/utils/formatar';

type Resultado = { ok: true; ingresso: Ingresso } | { ok: false; titulo: string; mensagem: string };

export default function Validar() {
  const c = useTema();
  const margem = useMargem();
  const [codigo, setCodigo] = useState('');
  const [validando, setValidando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function validar() {
    if (codigo.trim().length < 4) return;
    setValidando(true);
    try {
      const ingresso = await ingressoService.validar(codigo.trim());
      setResultado({ ok: true, ingresso });
      setCodigo('');
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      let titulo = 'Entrada recusada';
      let mensagem = mensagemDe(e);
      if (e instanceof ErroApi && e.status === 404) mensagem = 'Nenhum ingresso com esse código. Confira as letras e os números.';
      if (e instanceof ErroApi && e.codigo === 'IngressoJaUtilizado') {
        const quando = (e.detalhes as { utilizadoEm?: string } | undefined)?.utilizadoEm;
        titulo = 'Ingresso já usado';
        mensagem = quando ? `Este ingresso entrou às ${hora(quando)}.` : 'Este ingresso já passou pela entrada.';
      }
      setResultado({ ok: false, titulo, mensagem });
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setValidando(false);
    }
  }

  const corResultado = resultado?.ok ? c.verde : c.vermelho;

  return (
    <Tela semCabecalho titulo="Entrada" subtitulo="Digite o código do ingresso para liberar a entrada.">
      <View style={[estilos.area, { paddingHorizontal: margem }]}>
        <TextInput
          value={codigo}
          onChangeText={(t) => {
            setCodigo(t.toUpperCase().replace(/[^A-Z0-9]/g, ''));
            setResultado(null);
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          placeholder="Código"
          placeholderTextColor={c.rotuloTerciario}
          onSubmitEditing={validar}
          returnKeyType="done"
          accessibilityLabel="Código do ingresso"
          style={[
            fonteCodigo,
            estilos.codigo,
            { backgroundColor: c.fundoElevado, color: c.rotulo },
            Platform.OS === 'web' && { outlineWidth: 0 },
          ]}
        />
        <Botao titulo="Validar entrada" aoTocar={validar} carregando={validando} desabilitado={codigo.length < 4} />
      </View>

      {resultado ? (
        <View style={[estilos.resultado, { backgroundColor: c.fundoElevado, marginHorizontal: margem }]}>
          <View style={[estilos.circulo, { backgroundColor: corResultado }]}>
            <Ionicons name={resultado.ok ? 'checkmark' : 'close'} size={40} color="#FFFFFF" />
          </View>
          {resultado.ok ? (
            <>
              <Texto tipo="titulo2">Entrada liberada</Texto>
              <Texto tipo="tituloGrande" style={{ marginTop: espaco.s }}>
                {resultado.ingresso.assento}
              </Texto>
              <Texto tipo="nota" cor="secundario">
                Assento
              </Texto>
              <View style={[estilos.divisor, { backgroundColor: c.separador }]} />
              <Texto tipo="destaque" style={{ textAlign: 'center' }}>
                {resultado.ingresso.sessao.filme.titulo}
              </Texto>
              <Texto tipo="subtitulo" cor="secundario">
                {resultado.ingresso.sessao.sala.nome}, {dataHora(resultado.ingresso.sessao.inicio)}
              </Texto>
            </>
          ) : (
            <>
              <Texto tipo="titulo2">{resultado.titulo}</Texto>
              <Texto tipo="subtitulo" cor="secundario" style={{ textAlign: 'center', maxWidth: 320 }}>
                {resultado.mensagem}
              </Texto>
            </>
          )}
        </View>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  area: { gap: espaco.m },
  codigo: { fontSize: 30, fontWeight: '700', letterSpacing: 6, textAlign: 'center', paddingVertical: 18, borderRadius: 14 },
  resultado: {
    marginTop: espaco.xxl,
    borderRadius: 20,
    paddingVertical: espaco.xxl,
    paddingHorizontal: espaco.xl,
    alignItems: 'center',
    gap: 4,
  },
  circulo: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: espaco.m },
  divisor: { height: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: espaco.l },
});
