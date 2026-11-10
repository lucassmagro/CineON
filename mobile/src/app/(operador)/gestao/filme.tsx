import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import type { Classificacao } from '@/models/tipos';
import { mensagemDe } from '@/services/api';
import { filmeService } from '@/services/cineon';
import { Botao, Campo, Carregando, Grupo, LinhaSwitch, Segmentos, Tela, TextoErro } from '@/ui/componentes';
import { espaco } from '@/ui/tema';
import { confirmar } from '@/utils/dialogos';

const CLASSIFICACOES: { valor: Classificacao; rotulo: string }[] = [
  { valor: 'L', rotulo: 'L' },
  { valor: '10', rotulo: '10' },
  { valor: '12', rotulo: '12' },
  { valor: '14', rotulo: '14' },
  { valor: '16', rotulo: '16' },
  { valor: '18', rotulo: '18' },
];

// sem ?id cria um filme novo, com ?id edita
export default function FormularioFilme() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edicao = id !== undefined;
  const router = useRouter();

  const [titulo, setTitulo] = useState('');
  const [genero, setGenero] = useState('');
  const [duracao, setDuracao] = useState('');
  const [classificacao, setClassificacao] = useState<Classificacao | null>(null);
  const [sinopse, setSinopse] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [carregando, setCarregando] = useState(edicao);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!edicao) return;
    filmeService
      .buscar(Number(id))
      .then((f) => {
        setTitulo(f.titulo);
        setGenero(f.genero);
        setDuracao(String(f.duracaoMin));
        setClassificacao(f.classificacao);
        setSinopse(f.sinopse);
        setAtivo(f.ativo);
      })
      .catch((e) => setErro(mensagemDe(e)))
      .finally(() => setCarregando(false));
  }, [edicao, id]);

  async function salvar() {
    const duracaoMin = Number(duracao);
    if (!titulo.trim()) return setErro('Informe o título');
    if (!genero.trim()) return setErro('Informe o gênero');
    if (!Number.isInteger(duracaoMin) || duracaoMin < 1) return setErro('Informe a duração em minutos');
    if (!classificacao) return setErro('Escolha a classificação indicativa');
    setSalvando(true);
    setErro(null);
    try {
      const dados = { titulo: titulo.trim(), genero: genero.trim(), duracaoMin, classificacao, sinopse: sinopse.trim() };
      if (edicao) await filmeService.atualizar(Number(id), { ...dados, ativo });
      else await filmeService.criar(dados);
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!(await confirmar('Excluir filme?', 'Esta ação não pode ser desfeita.', 'Excluir', true))) return;
    try {
      await filmeService.remover(Number(id));
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }

  if (carregando) return <Carregando />;

  return (
    <Tela>
      <Stack.Screen options={{ title: edicao ? 'Editar filme' : 'Novo filme' }} />
      <Grupo>
        <Campo rotulo="Título" value={titulo} onChangeText={setTitulo} placeholder="Nome do filme" />
        <Campo rotulo="Gênero" value={genero} onChangeText={setGenero} placeholder="Ex.: Drama" />
        <Campo rotulo="Duração (minutos)" value={duracao} onChangeText={(t) => setDuracao(t.replace(/\D/g, ''))} teclado="number-pad" placeholder="Ex.: 120" ultima />
      </Grupo>
      <Grupo titulo="Classificação indicativa">
        <Segmentos opcoes={CLASSIFICACOES} valor={classificacao} aoMudar={setClassificacao} />
      </Grupo>
      <Grupo>
        <Campo rotulo="Sinopse (opcional)" value={sinopse} onChangeText={setSinopse} multiline ultima />
      </Grupo>
      {edicao ? (
        <Grupo nota="Filmes inativos não aparecem para os clientes e não recebem novas sessões.">
          <LinhaSwitch titulo="Ativo" valor={ativo} aoMudar={setAtivo} ultima />
        </Grupo>
      ) : null}
      <TextoErro texto={erro} />
      <View style={{ paddingHorizontal: espaco.l, gap: espaco.m }}>
        <Botao titulo="Salvar" aoTocar={salvar} carregando={salvando} />
        {edicao ? <Botao titulo="Excluir filme" tipo="destrutivo" aoTocar={excluir} /> : null}
      </View>
    </Tela>
  );
}
