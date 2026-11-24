// Na criação define o tamanho da sala (o banco gera os assentos).
// Na edição só dá pra mudar nome e se está ativa, o layout fica fixo.
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SalaDetalhada } from '@/models/tipos';
import { mensagemDe } from '@/services/api';
import { salaService } from '@/services/cineon';
import { Botao, Campo, Carregando, Contador, Linha, LinhaSwitch, Secao, Tela, Texto, TextoErro } from '@/ui/componentes';
import { espaco, useTema } from '@/ui/tema';
import { confirmar } from '@/utils/dialogos';

const MAX_FILAS = 26;
const MAX_POR_FILA = 30;

export default function FormularioSala() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edicao = id !== undefined;
  const router = useRouter();

  const [sala, setSala] = useState<SalaDetalhada | null>(null);
  const [nome, setNome] = useState('');
  const [filas, setFilas] = useState(8);
  const [porFila, setPorFila] = useState(12);
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

  async function salvar() {
    if (!nome.trim()) return setErro('Dê um nome para a sala');
    setSalvando(true);
    setErro(null);
    try {
      if (edicao) await salaService.atualizar(Number(id), { nome: nome.trim(), ativa });
      else await salaService.criar({ nome: nome.trim(), filas, assentosPorFila: porFila });
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!(await confirmar('Excluir sala?', 'Os assentos da sala também são removidos. Salas com sessões não podem ser excluídas.', 'Excluir', true))) return;
    try {
      await salaService.remover(Number(id));
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }

  if (carregando) return <Carregando />;

  const layout = edicao
    ? [...new Set(sala?.assentos.map((a) => a.fila))].map((f) => sala!.assentos.filter((a) => a.fila === f).length)
    : Array.from({ length: filas }, () => porFila);
  const capacidade = layout.reduce((t, n) => t + n, 0);

  return (
    <Tela
      rodape={
        <>
          <TextoErro texto={erro} />
          <Botao titulo={edicao ? 'Salvar alterações' : `Criar sala com ${capacidade} lugares`} icone={edicao ? 'checkmark' : 'add-circle'} aoTocar={salvar} carregando={salvando} />
        </>
      }>
      <Stack.Screen options={{ title: edicao ? 'Editar sala' : 'Nova sala' }} />

      <Secao>
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} placeholder="Sala 4" ultima />
      </Secao>

      {edicao ? (
        <Secao nota="O tamanho da sala não muda depois que ela recebe sessões.">
          <Linha titulo="Lugares" valor={String(sala?.capacidade ?? 0)} />
          <Linha titulo="Sessões cadastradas" valor={String(sala?.sessoes ?? 0)} />
          <LinhaSwitch titulo="Recebe novas sessões" valor={ativa} aoMudar={setAtiva} ultima />
        </Secao>
      ) : (
        <Secao titulo="Tamanho" nota="Os assentos são criados automaticamente, com filas A, B, C e números a partir de 1.">
          <Contador rotulo="Filas" detalhe={`A até ${String.fromCharCode(64 + filas)}`} valor={filas} aoMudar={setFilas} minimo={1} maximo={MAX_FILAS} />
          <Contador rotulo="Assentos por fila" valor={porFila} aoMudar={setPorFila} minimo={1} maximo={MAX_POR_FILA} ultima />
        </Secao>
      )}

      <Secao titulo={`${capacidade} lugares`}>
        <PreviaLayout filas={layout} />
      </Secao>

      {edicao ? (
        <Secao>
          <Linha titulo="Excluir sala" destrutivo acessorio="nenhum" aoTocar={excluir} ultima />
        </Secao>
      ) : null}
    </Tela>
  );
}

function PreviaLayout({ filas }: { filas: number[] }) {
  const c = useTema();
  const maior = Math.max(1, ...filas);
  const tamanho = Math.max(4, Math.min(12, Math.floor(260 / maior) - 2));
  return (
    <View style={estilos.previa}>
      <View style={[estilos.tela, { backgroundColor: c.rotuloTerciario }]} />
      <Texto tipo="legenda2" cor="terciario" style={{ marginBottom: espaco.m }}>
        Tela
      </Texto>
      {filas.map((n, i) => (
        <View key={i} style={estilos.fila}>
          {Array.from({ length: n }, (_, j) => (
            <View key={j} style={{ width: tamanho, height: tamanho, borderRadius: tamanho / 3, backgroundColor: c.preenchimentoForte }} />
          ))}
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  previa: { alignItems: 'center', paddingVertical: espaco.xl, paddingHorizontal: espaco.l },
  tela: { width: '70%', height: 3, borderRadius: 2, marginBottom: 4 },
  fila: { flexDirection: 'row', gap: 2, marginBottom: 2 },
});
