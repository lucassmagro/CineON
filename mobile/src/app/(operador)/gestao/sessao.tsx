import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import type { Filme, Sala, Sessao } from '@/models/tipos';
import { mensagemDe } from '@/services/api';
import { filmeService, salaService, sessaoService } from '@/services/cineon';
import { Botao, Campo, Carregando, Chips, Grupo, Linha, Tela, TextoErro } from '@/ui/componentes';
import { cores, espaco } from '@/ui/tema';
import { confirmar } from '@/utils/dialogos';
import { dataHora, dinheiro, hora, isoLocal, proximosDias } from '@/utils/formatar';

// Filme e sala são escolhidos na lista, o horário de término a API calcula.
// Com ?id só deixa mudar o preço ou excluir.
export default function FormularioSessao() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return id ? <EditarSessao id={Number(id)} /> : <NovaSessao />;
}

function NovaSessao() {
  const router = useRouter();
  const dias = proximosDias(14);
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [filmeId, setFilmeId] = useState<number | null>(null);
  const [salaId, setSalaId] = useState<number | null>(null);
  const [dia, setDia] = useState<string>(dias[0]!.valor);
  const [horario, setHorario] = useState('');
  const [preco, setPreco] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([filmeService.todos(), salaService.listar()])
      .then(([f, s]) => {
        setFilmes(f.filter((x) => x.ativo));
        setSalas(s.filter((x) => x.ativa && x.capacidade > 0));
      })
      .catch((e) => setErro(mensagemDe(e)))
      .finally(() => setCarregando(false));
  }, []);

  function formatarHorario(texto: string) {
    const digitos = texto.replace(/\D/g, '').slice(0, 4);
    setHorario(digitos.length > 2 ? `${digitos.slice(0, 2)}:${digitos.slice(2)}` : digitos);
  }

  async function salvar() {
    const valor = Number(preco.replace(',', '.'));
    if (!filmeId) return setErro('Escolha o filme');
    if (!salaId) return setErro('Escolha a sala');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) return setErro('Informe o horário no formato HH:MM');
    if (!preco.trim() || Number.isNaN(valor) || valor < 0) return setErro('Informe um preço válido');
    setSalvando(true);
    setErro(null);
    try {
      await sessaoService.criar({ filmeId, salaId, inicio: isoLocal(dia, horario), preco: Math.round(valor * 100) / 100 });
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <Carregando />;

  return (
    <Tela>
      <Stack.Screen options={{ title: 'Nova sessão' }} />
      <Grupo titulo="Filme">
        {filmes.map((f, i) => (
          <Linha
            key={f.id}
            titulo={f.titulo}
            subtitulo={`${f.duracaoMin} min`}
            destaque={filmeId === f.id ? <Text style={{ color: cores.azul, fontSize: 18 }}>✓</Text> : undefined}
            aoTocar={() => setFilmeId(f.id)}
            ultima={i === filmes.length - 1}
          />
        ))}
      </Grupo>
      <Grupo titulo="Sala">
        {salas.map((s, i) => (
          <Linha
            key={s.id}
            titulo={s.nome}
            subtitulo={`${s.capacidade} lugares`}
            destaque={salaId === s.id ? <Text style={{ color: cores.azul, fontSize: 18 }}>✓</Text> : undefined}
            aoTocar={() => setSalaId(s.id)}
            ultima={i === salas.length - 1}
          />
        ))}
      </Grupo>
      <View style={{ marginBottom: espaco.xl }}>
        <Text style={{ fontSize: 13, color: cores.textoSecundario, marginLeft: espaco.xxl, marginBottom: 6 }}>DIA</Text>
        <Chips opcoes={dias} valor={dia} aoMudar={setDia} />
      </View>
      <Grupo nota="O horário de término é calculado pela duração do filme + limpeza da sala.">
        <Campo rotulo="Horário de início" value={horario} onChangeText={formatarHorario} teclado="number-pad" placeholder="Ex.: 19:30" maxLength={5} />
        <Campo rotulo="Preço do ingresso (R$)" value={preco} onChangeText={(t) => setPreco(t.replace(/[^\d,.]/g, ''))} teclado="decimal-pad" placeholder="Ex.: 25,00" ultima />
      </Grupo>
      <TextoErro texto={erro} />
      <View style={{ paddingHorizontal: espaco.l }}>
        <Botao titulo="Criar sessão" aoTocar={salvar} carregando={salvando} />
      </View>
    </Tela>
  );
}

function EditarSessao({ id }: { id: number }) {
  const router = useRouter();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [preco, setPreco] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    sessaoService
      .buscar(id)
      .then((s) => {
        setSessao(s);
        setPreco(s.preco.toFixed(2).replace('.', ','));
      })
      .catch((e) => setErro(mensagemDe(e)));
  }, [id]);

  async function salvarPreco() {
    const valor = Number(preco.replace(',', '.'));
    if (Number.isNaN(valor) || valor < 0) return setErro('Informe um preço válido');
    setSalvando(true);
    setErro(null);
    try {
      await sessaoService.atualizarPreco(id, Math.round(valor * 100) / 100);
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!(await confirmar('Excluir sessão?', 'Só é possível excluir sessões sem reservas ou vendas.', 'Excluir', true))) return;
    try {
      await sessaoService.remover(id);
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }

  if (!sessao) return erro ? <TextoErro texto={erro} /> : <Carregando />;

  return (
    <Tela>
      <Stack.Screen options={{ title: 'Sessão' }} />
      <Grupo>
        <Linha titulo="Filme" valor={sessao.filme.titulo} />
        <Linha titulo="Sala" valor={sessao.sala.nome} />
        <Linha titulo="Início" valor={dataHora(sessao.inicio)} />
        <Linha titulo="Término" valor={hora(sessao.fim)} />
        <Linha titulo="Preço atual" valor={dinheiro(sessao.preco)} ultima />
      </Grupo>
      <Grupo nota="O preço só pode mudar enquanto não houver reservas ou vendas.">
        <Campo rotulo="Novo preço (R$)" value={preco} onChangeText={(t) => setPreco(t.replace(/[^\d,.]/g, ''))} teclado="decimal-pad" ultima />
      </Grupo>
      <TextoErro texto={erro} />
      <View style={{ paddingHorizontal: espaco.l, gap: espaco.m }}>
        <Botao titulo="Salvar preço" aoTocar={salvarPreco} carregando={salvando} />
        <Botao titulo="Excluir sessão" tipo="destrutivo" aoTocar={excluir} />
      </View>
    </Tela>
  );
}
