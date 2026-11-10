// Sessões agrupadas por dia com pílulas de dia em cima. Usada na bilheteria e na gerência.
import { useState } from 'react';
import { View } from 'react-native';

import type { Sessao } from '@/models/tipos';
import { Linha, Secao, Texto, Vazio } from '@/ui/componentes';
import { espaco } from '@/ui/tema';
import { chaveDia, dinheiro, hora } from '@/utils/formatar';

import { Arte } from './Arte';
import { SeletorDia } from './SeletorDia';

export function ListaSessoesDoDia({ sessoes, aoTocar }: { sessoes: Sessao[]; aoTocar: (s: Sessao) => void }) {
  const [diaEscolhido, setDiaEscolhido] = useState<string | null>(null);
  const dias = [...new Set(sessoes.map((s) => chaveDia(s.inicio)))];
  const dia = diaEscolhido && dias.includes(diaEscolhido) ? diaEscolhido : (dias[0] ?? null);
  const doDia = sessoes.filter((s) => chaveDia(s.inicio) === dia);

  if (dias.length === 0) {
    return <Vazio icone="calendar-outline" titulo="Nenhuma sessão programada" texto="As próximas sessões aparecem aqui assim que forem criadas na gerência." />;
  }

  return (
    <View>
      <SeletorDia dias={dias} valor={dia} aoMudar={setDiaEscolhido} />
      <Secao estilo={{ marginTop: espaco.xl }} titulo={`${doDia.length} ${doDia.length === 1 ? 'sessão' : 'sessões'}`}>
        {doDia.map((s, i) => (
          <Linha
            key={s.id}
            esquerda={<Arte titulo={s.filme.titulo} id={s.filme.id} poster={s.filme.posterUrl} mini />}
            titulo={s.filme.titulo}
            subtitulo={`${s.sala.nome}, ${dinheiro(s.preco)}`}
            direita={
              <Texto tipo="titulo3" style={{ fontVariant: ['tabular-nums'] }}>
                {hora(s.inicio)}
              </Texto>
            }
            aoTocar={() => aoTocar(s)}
            ultima={i === doDia.length - 1}
          />
        ))}
      </Secao>
    </View>
  );
}

