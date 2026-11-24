import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useCarregar } from '@/hooks/useCarregar';
import { filmeService, salaService, sessaoService } from '@/services/cineon';
import { Surgir } from '@/ui/animacoes';
import { Linha, Secao, Tela, Texto, type NomeIcone } from '@/ui/componentes';
import { espaco, raio, useMargem, useTema } from '@/ui/tema';
import { Tocavel } from '@/ui/Tocavel';

// só pros números ao lado das listas; se falhar, a tela continua igual sem eles
async function contarTudo() {
  const [filmes, salas, sessoes] = await Promise.all([filmeService.todos(), salaService.listar(), sessaoService.listar()]);
  return { filmes: filmes.length, salas: salas.length, sessoes: sessoes.length };
}

function plural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`;
}

export default function Gerencia() {
  const router = useRouter();
  const c = useTema();
  const margem = useMargem();
  const { width } = useWindowDimensions();
  const contagem = useCarregar(contarTudo).dados;
  const ir = (rota: Href) => () => router.push(rota);
  const emGrade = width >= 600;

  const atalhos: { titulo: string; texto: string; icone: NomeIcone; cor: string; rota: Href }[] = [
    { titulo: 'Novo filme', texto: 'Título, duração e pôster', icone: 'film', cor: c.vermelho, rota: '/gestao/filme' },
    { titulo: 'Nova sala', texto: 'Nome, filas e assentos por fila', icone: 'grid', cor: c.indigo, rota: '/gestao/sala' },
    { titulo: 'Nova sessão', texto: 'Filme, sala, dia, horário e preço', icone: 'calendar', cor: c.laranja, rota: '/gestao/sessao' },
  ];

  return (
    <Tela semCabecalho titulo="Gerência" subtitulo="Cadastre e organize a programação do cinema">
      <View style={{ paddingHorizontal: margem, marginBottom: espaco.xxl }}>
        <Texto tipo="destaque" style={estilos.rotulo}>
          Cadastrar
        </Texto>
        <View style={emGrade ? estilos.grade : estilos.coluna}>
          {atalhos.map((a, i) => (
            <Surgir key={a.titulo} indice={i} style={emGrade ? { flex: 1 } : undefined}>
              <CartaoCriar {...a} emGrade={emGrade} aoTocar={ir(a.rota)} />
            </Surgir>
          ))}
        </View>
      </View>

      <Secao titulo="Consultar e editar" nota="Toque num item da lista pra editar ou excluir.">
        <Linha icone={{ nome: 'film', cor: c.vermelho }} titulo="Filmes" valor={contagem ? plural(contagem.filmes, 'filme', 'filmes') : undefined} aoTocar={ir('/gestao/filmes')} />
        <Linha icone={{ nome: 'grid', cor: c.indigo }} titulo="Salas e assentos" valor={contagem ? plural(contagem.salas, 'sala', 'salas') : undefined} aoTocar={ir('/gestao/salas')} />
        <Linha icone={{ nome: 'calendar', cor: c.laranja }} titulo="Sessões" valor={contagem ? plural(contagem.sessoes, 'próxima', 'próximas') : undefined} aoTocar={ir('/gestao/sessoes')} ultima />
      </Secao>
      <Secao titulo="Resultados">
        <Linha icone={{ nome: 'bar-chart', cor: c.verde }} titulo="Vendas e ocupação" aoTocar={ir('/gestao/relatorios')} ultima />
      </Secao>
      <Secao titulo="Equipe">
        <Linha icone={{ nome: 'person-add', cor: c.cinza }} titulo="Novo operador" aoTocar={ir('/gestao/operador')} ultima />
      </Secao>
    </Tela>
  );
}

// cartão grande de "criar": no celular fica deitado, em tela larga vira coluna
function CartaoCriar({
  titulo,
  texto,
  icone,
  cor,
  emGrade,
  aoTocar,
}: {
  titulo: string;
  texto: string;
  icone: NomeIcone;
  cor: string;
  emGrade: boolean;
  aoTocar: () => void;
}) {
  const c = useTema();
  return (
    <Tocavel
      onPress={aoTocar}
      escala={0.97}
      escalaHover={1.015}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      style={[estilos.cartao, emGrade ? estilos.cartaoGrade : estilos.cartaoLinha, { backgroundColor: c.fundoElevado }]}>
      <View style={[estilos.icone, { backgroundColor: cor }]}>
        <Ionicons name={icone} size={22} color="#FFFFFF" />
      </View>
      <View style={emGrade ? estilos.textosGrade : estilos.textosLinha}>
        <Texto tipo="titulo3">{titulo}</Texto>
        <Texto tipo="subtitulo" cor="secundario" numberOfLines={2} style={{ marginTop: 2 }}>
          {texto}
        </Texto>
      </View>
      {emGrade ? (
        <View style={[estilos.acaoGrade, { backgroundColor: c.azul }]}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Texto tipo="subtitulo" cor="#FFFFFF" peso="600">
            Criar
          </Texto>
        </View>
      ) : (
        <View style={[estilos.acaoLinha, { backgroundColor: c.azul }]}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </View>
      )}
    </Tocavel>
  );
}

const estilos = StyleSheet.create({
  rotulo: { marginLeft: espaco.xs, marginBottom: espaco.s, letterSpacing: -0.3 },
  coluna: { gap: espaco.m },
  grade: { flexDirection: 'row', gap: espaco.m },
  cartao: { borderRadius: raio.grande },
  cartaoLinha: { flexDirection: 'row', alignItems: 'center', gap: espaco.m, padding: espaco.l },
  cartaoGrade: { flex: 1, padding: espaco.l, gap: espaco.m },
  icone: { width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  textosLinha: { flex: 1 },
  textosGrade: { flex: 1 },
  acaoLinha: { width: 40, height: 40, borderRadius: raio.pilula, alignItems: 'center', justifyContent: 'center' },
  acaoGrade: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 36, borderRadius: raio.pilula },
});
