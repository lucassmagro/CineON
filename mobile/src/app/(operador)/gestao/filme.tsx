import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Arte } from '@/components/Arte';
import { SeloClassificacao, textoClassificacao } from '@/components/SeloClassificacao';
import type { Classificacao } from '@/models/tipos';
import { mensagemDe } from '@/services/api';
import { filmeService } from '@/services/cineon';
import { Botao, Campo, Carregando, Linha, LinhaSwitch, Secao, Tela, TextoErro } from '@/ui/componentes';
import { espaco, useTema } from '@/ui/tema';
import { Tocavel } from '@/ui/Tocavel';
import { confirmar } from '@/utils/dialogos';

const CLASSIFICACOES: Classificacao[] = ['L', '10', '12', '14', '16', '18'];
// igual ao limite da API; conferir aqui evita mandar um arquivo enorme à toa
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

// sem ?id cria um filme novo, com ?id edita
export default function FormularioFilme() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edicao = id !== undefined;
  const router = useRouter();
  const c = useTema();

  const [titulo, setTitulo] = useState('');
  const [genero, setGenero] = useState('');
  const [duracao, setDuracao] = useState('');
  const [classificacao, setClassificacao] = useState<Classificacao | null>(null);
  const [sinopse, setSinopse] = useState('');
  const [poster, setPoster] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [carregando, setCarregando] = useState(edicao);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
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
        setPoster(f.posterUrl ?? '');
        setAtivo(f.ativo);
      })
      .catch((e) => setErro(mensagemDe(e)))
      .finally(() => setCarregando(false));
  }, [edicao, id]);

  async function salvar() {
    const duracaoMin = Number(duracao);
    if (!titulo.trim()) return setErro('Informe o título do filme');
    if (!genero.trim()) return setErro('Informe o gênero');
    if (!Number.isInteger(duracaoMin) || duracaoMin < 1) return setErro('Informe a duração em minutos');
    if (!classificacao) return setErro('Escolha a classificação indicativa');
    setSalvando(true);
    setErro(null);
    try {
      const dados = { titulo: titulo.trim(), genero: genero.trim(), duracaoMin, classificacao, sinopse: sinopse.trim(), posterUrl: poster.trim() || null };
      if (edicao) await filmeService.atualizar(Number(id), { ...dados, ativo });
      else await filmeService.criar(dados);
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setSalvando(false);
    }
  }

  // no computador abre o seletor de arquivos, no celular a galeria; a imagem vai pra API e volta o caminho
  async function escolherImagem() {
    const escolha = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [2, 3], quality: 0.85 });
    const imagem = escolha.canceled ? undefined : escolha.assets[0];
    if (!imagem) return;
    setEnviando(true);
    setErro(null);
    try {
      const arquivo = await (await fetch(imagem.uri)).blob();
      if (arquivo.size > TAMANHO_MAXIMO) throw new Error('A imagem passa de 5 MB. Escolha uma menor.');
      const { posterUrl } = await filmeService.enviarPoster(arquivo, imagem.mimeType ?? (arquivo.type || 'image/jpeg'));
      setPoster(posterUrl);
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setEnviando(false);
    }
  }

  async function excluir() {
    if (!(await confirmar('Excluir filme?', 'O filme some do cadastro. Filmes com sessões não podem ser excluídos, só desativados.', 'Excluir', true))) return;
    try {
      await filmeService.remover(Number(id));
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }

  if (carregando) return <Carregando />;

  return (
    <Tela
      rodape={
        <>
          <TextoErro texto={erro} />
          <Botao titulo={edicao ? 'Salvar alterações' : 'Cadastrar filme'} icone={edicao ? 'checkmark' : 'add-circle'} aoTocar={salvar} carregando={salvando} desabilitado={enviando} />
        </>
      }>
      <Stack.Screen options={{ title: edicao ? 'Editar filme' : 'Novo filme' }} />

      {titulo.trim() ? (
        <View style={estilos.previa}>
          <Arte titulo={titulo.trim()} id={edicao ? Number(id) : undefined} genero={genero.trim() || undefined} poster={poster.trim() || null} estilo={{ width: 128 }} />
        </View>
      ) : null}

      <Secao>
        <Campo rotulo="Título" value={titulo} onChangeText={setTitulo} placeholder="Nome do filme" />
        <Campo rotulo="Gênero" value={genero} onChangeText={setGenero} placeholder="Drama, Comédia…" />
        <Campo
          rotulo="Duração"
          value={duracao}
          onChangeText={(t) => setDuracao(t.replace(/\D/g, '').slice(0, 3))}
          keyboardType="number-pad"
          placeholder="Minutos"
          ultima
        />
      </Secao>

      <Secao titulo="Classificação indicativa" nota={classificacao ? textoClassificacao(classificacao) : 'Toque no selo correspondente.'}>
        <View style={estilos.selos}>
          {CLASSIFICACOES.map((cl) => {
            const ativa = cl === classificacao;
            return (
              <Tocavel
                key={cl}
                onPress={() => setClassificacao(cl)}
                escala={0.88}
                vibracao="selecao"
                accessibilityRole="radio"
                accessibilityState={{ checked: ativa }}
                accessibilityLabel={textoClassificacao(cl)}
                style={[estilos.selo, { borderColor: ativa ? c.azul : 'transparent' }]}>
                <SeloClassificacao valor={cl} tamanho={34} />
              </Tocavel>
            );
          })}
        </View>
      </Secao>

      <Secao titulo="Sinopse">
        <Campo rotulo="Sinopse" ocultarRotulo value={sinopse} onChangeText={setSinopse} multiline placeholder="Opcional" ultima />
      </Secao>

      <Secao titulo="Pôster" nota="Imagem em pé (2:3), JPG, PNG ou WebP de até 5 MB. Também dá pra colar o endereço de uma imagem. Sem pôster, a capa usa a cor do filme com o título.">
        <View style={[estilos.poster, { borderBottomColor: c.separador }]}>
          <Arte titulo={titulo.trim() || 'Filme'} id={edicao ? Number(id) : undefined} poster={poster.trim() || null} mini estilo={estilos.miniatura} />
          <View style={estilos.acoesPoster}>
            <Botao
              titulo={enviando ? 'Enviando…' : poster.trim() ? 'Trocar imagem' : 'Escolher imagem'}
              icone="image-outline"
              variante="tingido"
              compacto
              carregando={enviando}
              aoTocar={escolherImagem}
            />
            {poster.trim() && !enviando ? <Botao titulo="Remover pôster" variante="destrutivo" compacto aoTocar={() => setPoster('')} /> : null}
          </View>
        </View>
        <Campo
          rotulo="Endereço"
          value={poster}
          onChangeText={setPoster}
          placeholder="https://… ou /posteres/arquivo.jpg"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          ultima
        />
      </Secao>

      {edicao ? (
        <Secao nota="Filmes inativos não aparecem para os clientes e não recebem novas sessões.">
          <LinhaSwitch titulo="Em exibição" valor={ativo} aoMudar={setAtivo} ultima />
        </Secao>
      ) : null}

      {edicao ? (
        <Secao>
          <Linha titulo="Excluir filme" destrutivo acessorio="nenhum" aoTocar={excluir} ultima />
        </Secao>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  previa: { alignItems: 'center', marginBottom: espaco.xxl, marginTop: espaco.s },
  selos: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: espaco.l, paddingVertical: espaco.m },
  selo: { padding: 3, borderRadius: 11, borderWidth: 2.5 },
  poster: { flexDirection: 'row', alignItems: 'center', gap: espaco.l, padding: espaco.l, borderBottomWidth: StyleSheet.hairlineWidth },
  miniatura: { width: 64, height: 96, borderRadius: 8 },
  acoesPoster: { flex: 1, alignItems: 'flex-start', gap: espaco.s },
});
