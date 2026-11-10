import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Ingresso } from '@/models/tipos';
import { ErroApi, mensagemDe } from '@/services/api';
import { ingressoService } from '@/services/cineon';
import { Botao, Campo, Grupo, Tela, TituloGrande } from '@/ui/componentes';
import { cores, espaco, fonte, raio } from '@/ui/tema';
import { dataHora, hora } from '@/utils/formatar';

type Resultado = { ok: true; ingresso: Ingresso } | { ok: false; titulo: string; mensagem: string };

export default function Validar() {
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
    } catch (e) {
      let titulo = 'Entrada recusada';
      let mensagem = mensagemDe(e);
      if (e instanceof ErroApi && e.status === 404) mensagem = 'Código não encontrado. Confira os caracteres.';
      if (e instanceof ErroApi && e.codigo === 'IngressoJaUtilizado') {
        const quando = (e.detalhes as { utilizadoEm?: string } | undefined)?.utilizadoEm;
        titulo = 'Ingresso já utilizado';
        mensagem = quando ? `Este ingresso entrou às ${hora(quando)}.` : 'Este ingresso já foi utilizado.';
      }
      setResultado({ ok: false, titulo, mensagem });
    } finally {
      setValidando(false);
    }
  }

  return (
    <Tela semCabecalho>
      <TituloGrande texto="Validar ingresso" subtitulo="Digite o código apresentado pelo cliente" />
      <Grupo>
        <Campo
          rotulo="Código do ingresso"
          value={codigo}
          onChangeText={(t) => {
            setCodigo(t.toUpperCase());
            setResultado(null);
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={12}
          placeholder="EX.: K7QX3M9PZA"
          onSubmitEditing={validar}
          style={{ ...fonte.mono, fontSize: 22, letterSpacing: 2, paddingVertical: 6 }}
          ultima
        />
      </Grupo>
      <View style={{ paddingHorizontal: espaco.l }}>
        <Botao titulo="Validar entrada" aoTocar={validar} carregando={validando} desabilitado={codigo.trim().length < 4} />
      </View>

      {resultado ? (
        <View style={[estilos.resultado, { backgroundColor: resultado.ok ? cores.verdeClaro : cores.vermelhoClaro }]}>
          <Text style={[estilos.icone, { color: resultado.ok ? cores.verde : cores.vermelho }]}>{resultado.ok ? '✓' : '✕'}</Text>
          {resultado.ok ? (
            <>
              <Text style={fonte.titulo}>Entrada liberada</Text>
              <Text style={fonte.subtitulo}>Assento {resultado.ingresso.assento}</Text>
              <Text style={estilos.detalhe}>
                {resultado.ingresso.sessao.filme.titulo} · {resultado.ingresso.sessao.sala.nome}
              </Text>
              <Text style={estilos.detalhe}>{dataHora(resultado.ingresso.sessao.inicio)}</Text>
            </>
          ) : (
            <>
              <Text style={fonte.titulo}>{resultado.titulo}</Text>
              <Text style={[estilos.detalhe, { textAlign: 'center' }]}>{resultado.mensagem}</Text>
            </>
          )}
        </View>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  resultado: { margin: espaco.l, marginTop: espaco.xl, borderRadius: raio.grande, padding: espaco.xl, alignItems: 'center', gap: 6 },
  icone: { fontSize: 48, fontWeight: '700' },
  detalhe: { ...fonte.secundario, color: cores.textoSecundario },
});
