// Filme e sala são escolhidos na lista; o horário de término quem calcula é a API.
// Com ?id só deixa mudar o preço ou excluir.
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Arte } from '@/components/Arte';
import { SeletorDia } from '@/components/SeletorDia';
import type { Filme, Sala, Sessao } from '@/models/tipos';
import { mensagemDe } from '@/services/api';
import { filmeService, salaService, sessaoService } from '@/services/cineon';
import { Botao, Campo, Carregando, Linha, MensagemErro, Secao, Tela, Texto, TextoErro } from '@/ui/componentes';
import { espaco, useMargem, useTema } from '@/ui/tema';
import { confirmar } from '@/utils/dialogos';
import { dataHora, dinheiro, hora, isoLocal, proximosDias } from '@/utils/formatar';
import { Tocavel } from '@/ui/Tocavel';

const HORARIOS_COMUNS = ['14:00', '16:30', '19:00', '21:30'];
const LIMPEZA_MIN = 15;

export default function FormularioSessao() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return id ? <EditarSessao id={Number(id)} /> : <NovaSessao />;
}

function NovaSessao() {
  const router = useRouter();
  const c = useTema();
  const margem = useMargem();
  const dias = proximosDias(14).map((d) => d.valor);
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [filmeId, setFilmeId] = useState<number | null>(null);
  const [salaId, setSalaId] = useState<number | null>(null);
  const [dia, setDia] = useState<string>(dias[0]!);
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

  const horarioValido = /^([01]\d|2[0-3]):[0-5]\d$/.test(horario);
  const filme = filmes.find((f) => f.id === filmeId);
  const fimPrevisto = filme && horarioValido ? hora(new Date(new Date(isoLocal(dia, horario)).getTime() + (filme.duracaoMin + LIMPEZA_MIN) * 60_000)) : null;

  async function salvar() {
    const valor = Number(preco.replace(',', '.'));
    if (!filmeId) return setErro('Escolha o filme');
    if (!salaId) return setErro('Escolha a sala');
    if (!horarioValido) return setErro('Informe o horário de início, por exemplo 19:30');
    if (!preco.trim() || Number.isNaN(valor) || valor < 0) return setErro('Informe o preço do ingresso');
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

      <Texto tipo="destaque" style={[estilos.rotulo, { marginLeft: margem + espaco.xs }]}>
        Filme
      </Texto>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[estilos.cartazes, { paddingHorizontal: margem }]}>
        {filmes.map((f) => {
          const ativo = f.id === filmeId;
          return (
            <Tocavel
              key={f.id}
              onPress={() => setFilmeId(f.id)}
              escala={0.95}
              vibracao="selecao"
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
              accessibilityLabel={f.titulo}
              style={{ width: 104 }}>
              <View style={[estilos.moldura, { borderColor: ativo ? c.azul : 'transparent' }]}>
                <Arte titulo={f.titulo} id={f.id} poster={f.posterUrl} estilo={{ borderRadius: 11 }} />
                {ativo ? (
                  <View style={[estilos.marcado, { backgroundColor: c.azul }]}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
              <Texto tipo="nota" peso={ativo ? '600' : '400'} numberOfLines={2} style={{ marginTop: 6 }}>
                {f.titulo}
              </Texto>
            </Tocavel>
          );
        })}
      </ScrollView>

      <Secao titulo="Sala" estilo={{ marginTop: espaco.xl }}>
        {salas.map((s, i) => (
          <Linha
            key={s.id}
            titulo={s.nome}
            subtitulo={`${s.capacidade} lugares`}
            acessorio={salaId === s.id ? 'check' : 'nenhum'}
            aoTocar={() => setSalaId(s.id)}
            ultima={i === salas.length - 1}
          />
        ))}
      </Secao>

      <Texto tipo="destaque" style={[estilos.rotulo, { marginLeft: margem + espaco.xs }]}>
        Dia
      </Texto>
      <SeletorDia dias={dias} valor={dia} aoMudar={setDia} />

      <Secao titulo="Horário e preço" estilo={{ marginTop: espaco.xxl }} nota={fimPrevisto ? `Termina por volta das ${fimPrevisto}, já contando ${LIMPEZA_MIN} minutos de limpeza da sala.` : undefined}>
        <Campo rotulo="Início" value={horario} onChangeText={formatarHorario} keyboardType="number-pad" placeholder="19:30" maxLength={5} />
        <View style={estilos.sugestoes}>
          {HORARIOS_COMUNS.map((h) => (
            <Botao key={h} titulo={h} variante="tingido" compacto aoTocar={() => setHorario(h)} estilo={horario === h ? { backgroundColor: c.azul } : undefined} corTexto={horario === h ? '#FFFFFF' : undefined} />
          ))}
        </View>
        <Campo rotulo="Preço" value={preco} onChangeText={(t) => setPreco(t.replace(/[^\d,.]/g, ''))} keyboardType="decimal-pad" placeholder="R$ 0,00" ultima />
      </Secao>

      <TextoErro texto={erro} />
      <View style={{ paddingHorizontal: margem }}>
        <Botao titulo="Criar sessão" aoTocar={salvar} carregando={salvando} />
      </View>
    </Tela>
  );
}

function EditarSessao({ id }: { id: number }) {
  const router = useRouter();
  const margem = useMargem();
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
    if (!(await confirmar('Excluir sessão?', 'Só dá para excluir sessões que ainda não têm reservas nem vendas.', 'Excluir', true))) return;
    try {
      await sessaoService.remover(id);
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }

  if (!sessao) return erro ? <MensagemErro mensagem={erro} /> : <Carregando />;

  return (
    <Tela>
      <Stack.Screen options={{ title: 'Sessão' }} />
      <View style={[estilos.cabecalho, { paddingHorizontal: margem }]}>
        <Arte titulo={sessao.filme.titulo} id={sessao.filme.id} poster={sessao.filme.posterUrl} estilo={{ width: 72 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Texto tipo="titulo3">{sessao.filme.titulo}</Texto>
          <Texto tipo="subtitulo" cor="secundario">
            {dataHora(sessao.inicio)}
          </Texto>
          <Texto tipo="subtitulo" cor="secundario">
            {sessao.sala.nome}, até {hora(sessao.fim)}
          </Texto>
        </View>
      </View>
      <Secao nota="O preço só muda enquanto a sessão não tiver reservas nem vendas.">
        <Linha titulo="Preço atual" valor={dinheiro(sessao.preco)} />
        <Campo rotulo="Novo preço" value={preco} onChangeText={(t) => setPreco(t.replace(/[^\d,.]/g, ''))} keyboardType="decimal-pad" ultima />
      </Secao>
      <TextoErro texto={erro} />
      <View style={{ paddingHorizontal: margem, marginBottom: espaco.xxl }}>
        <Botao titulo="Salvar preço" aoTocar={salvarPreco} carregando={salvando} />
      </View>
      <Secao>
        <Linha titulo="Excluir sessão" destrutivo acessorio="nenhum" aoTocar={excluir} ultima />
      </Secao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  rotulo: { marginBottom: espaco.s },
  cartazes: { gap: espaco.m },
  moldura: { borderWidth: 3, borderRadius: 14, padding: 2 },
  marcado: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  sugestoes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s, paddingHorizontal: espaco.l, paddingBottom: espaco.m },
  cabecalho: { flexDirection: 'row', gap: espaco.l, alignItems: 'center', marginBottom: espaco.xxl, marginTop: espaco.s },
});
