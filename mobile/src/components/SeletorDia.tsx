// Pílulas de dia: dia da semana em cima, número embaixo.
import { StyleSheet } from 'react-native';

import { Texto } from '@/ui/componentes';
import { RolagemComSetas } from '@/ui/RolagemComSetas';
import { espaco, useMargem, useTema } from '@/ui/tema';
import { Tocavel } from '@/ui/Tocavel';
import { partesDoDia } from '@/utils/formatar';

export function SeletorDia({
  dias,
  valor,
  aoMudar,
  corAtiva,
  corTextoAtivo,
}: {
  dias: string[];
  valor: string | null;
  aoMudar: (dia: string) => void;
  /** na página do filme o dia escolhido usa o destaque do pôster; no resto, preto/branco */
  corAtiva?: string;
  corTextoAtivo?: string;
}) {
  const c = useTema();
  const margem = useMargem();
  const fundoAtivo = corAtiva ?? c.rotulo;
  const textoAtivo = corTextoAtivo ?? c.fundoElevado;
  return (
    <RolagemComSetas contentContainerStyle={[estilos.lista, { paddingHorizontal: margem }]}>
      {dias.map((d) => {
        const p = partesDoDia(d);
        const ativo = d === valor;
        return (
          <Tocavel
            key={d}
            onPress={() => aoMudar(d)}
            escala={0.92}
            vibracao="selecao"
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={`${p.semana} ${p.numero} de ${p.mes}`}
            estiloPressionado={ativo ? null : { backgroundColor: c.preenchimentoForte }}
            style={[estilos.dia, { backgroundColor: ativo ? fundoAtivo : c.fundoElevado }]}>
            <Texto tipo="legenda" peso="600" cor={ativo ? textoAtivo : p.hoje ? 'vermelho' : 'secundario'}>
              {p.semana}
            </Texto>
            <Texto tipo="titulo3" peso="600" cor={ativo ? textoAtivo : 'rotulo'} style={{ fontVariant: ['tabular-nums'] }}>
              {p.numero}
            </Texto>
          </Tocavel>
        );
      })}
    </RolagemComSetas>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espaco.s },
  dia: { width: 52, height: 62, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
