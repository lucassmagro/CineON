import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { SalaDetalhada } from '@/models/tipos';
import { mensagemDe } from '@/services/api';
import { salaService } from '@/services/cineon';
import { Botao, Campo, Carregando, Grupo, Linha, LinhaSwitch, Tela, TextoErro } from '@/ui/componentes';
import { cores, espaco } from '@/ui/tema';
import { confirmar } from '@/utils/dialogos';

const MAX_FILAS = 26;
const MAX_POR_FILA = 30;

// Na criação pede filas e assentos por fila (o banco gera os assentos).
// Na edição só dá pra mudar nome e ativa, o layout fica fixo.
export default function FormularioSala() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edicao = id !== undefined;
  const router = useRouter();

  const [sala, setSala] = useState<SalaDetalhada | null>(null);
  const [nome, setNome] = useState('');
  const [filas, setFilas] = useState('');
  const [porFila, setPorFila] = useState('');
  const [ativa, setAtiva] = useState(true);
  const [carregando, setCarregando] = useState(edicao);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!edicao) return;
    salaService
      .buscar(Number(id))
      .then((s) => {
        setSala(s);
        setNome(s.nome);
        setAtiva(s.ativa);
      })
      .catch((e) => setErro(mensagemDe(e)))
      .finally(() => setCarregando(false));
  }, [edicao, id]);

  const nFilas = Number(filas);
  const nPorFila = Number(porFila);
  const layoutValido = nFilas >= 1 && nFilas <= MAX_FILAS && nPorFila >= 1 && nPorFila <= MAX_POR_FILA;

  async function salvar() {
    if (!nome.trim()) return setErro('Informe o nome da sala');
    if (!edicao && !layoutValido) return setErro(`Use de 1 a ${MAX_FILAS} filas e de 1 a ${MAX_POR_FILA} assentos por fila`);
    setSalvando(true);
    setErro(null);
    try {
      if (edicao) await salaService.atualizar(Number(id), { nome: nome.trim(), ativa });
      else await salaService.criar({ nome: nome.trim(), filas: nFilas, assentosPorFila: nPorFila });
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!(await confirmar('Excluir sala?', 'Os assentos da sala também serão removidos.', 'Excluir', true))) return;
    try {
      await salaService.remover(Number(id));
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }

  if (carregando) return <Carregando />;

  const filasPrevia = edicao
    ? [...new Set(sala?.assentos.map((a) => a.fila))].map((f) => sala!.assentos.filter((a) => a.fila === f).length)
    : layoutValido
      ? Array.from({ length: nFilas }, () => nPorFila)
      : [];

  return (
    <Tela>
      <Stack.Screen options={{ title: edicao ? 'Editar sala' : 'Nova sala' }} />
      <Grupo>
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Sala 4" ultima={edicao} />
        {!edicao ? (
          <>
            <Campo rotulo={`Filas (1 a ${MAX_FILAS})`} value={filas} onChangeText={(t) => setFilas(t.replace(/\D/g, ''))} teclado="number-pad" placeholder="Ex.: 8" />
            <Campo rotulo={`Assentos por fila (1 a ${MAX_POR_FILA})`} value={porFila} onChangeText={(t) => setPorFila(t.replace(/\D/g, ''))} teclado="number-pad" placeholder="Ex.: 12" ultima />
          </>
        ) : null}
      </Grupo>

      {edicao && sala ? (
        <Grupo nota="O layout de assentos é fixo depois que a sala recebe sessões.">
          <Linha titulo="Lugares" valor={String(sala.capacidade)} />
          <Linha titulo="Sessões cadastradas" valor={String(sala.sessoes)} />
          <LinhaSwitch titulo="Ativa" valor={ativa} aoMudar={setAtiva} ultima />
        </Grupo>
      ) : null}

      {filasPrevia.length > 0 ? (
        <Grupo titulo={`Prévia · ${filasPrevia.reduce((t, n) => t + n, 0)} lugares`}>
          <View style={estilos.previa}>
            {filasPrevia.map((n, i) => (
              <View key={i} style={estilos.fila}>
                <Text style={estilos.letra}>{String.fromCharCode(65 + i)}</Text>
                {Array.from({ length: n }, (_, j) => (
                  <View key={j} style={estilos.ponto} />
                ))}
              </View>
            ))}
          </View>
        </Grupo>
      ) : null}

      <TextoErro texto={erro} />
      <View style={{ paddingHorizontal: espaco.l, gap: espaco.m }}>
        <Botao titulo={edicao ? 'Salvar' : 'Criar sala'} aoTocar={salvar} carregando={salvando} />
        {edicao ? <Botao titulo="Excluir sala" tipo="destrutivo" aoTocar={excluir} /> : null}
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  previa: { padding: espaco.l, gap: 4, alignItems: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  letra: { width: 14, fontSize: 10, color: cores.textoSecundario },
  ponto: { width: 8, height: 8, borderRadius: 2, backgroundColor: cores.cinzaAssento },
});
