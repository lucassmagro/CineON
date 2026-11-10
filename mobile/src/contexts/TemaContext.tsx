// Guarda a aparência escolhida (automática, clara ou escura) e anima a troca de tema.
// Na Web a página inteira faz um esmaecimento cruzado; no celular um véu com o fundo antigo esmaece.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Animated, Platform, StyleSheet, View, useColorScheme } from 'react-native';

import { lerAparencia, lerAparenciaImediata, salvarAparencia } from '@/storage/preferenciasStorage';
import { ContextoAparencia, type Aparencia } from '@/ui/aparencia';
import { curvaApple, useReduzirMovimento } from '@/ui/movimento';
import { coresFundo } from '@/ui/tema';
import { transicaoSuave } from '@/utils/transicaoTema';

export function TemaProvider({ children }: { children: ReactNode }) {
  const sistema = useColorScheme();
  const [preferencia, setPreferencia] = useState<Aparencia>(() => lerAparenciaImediata() ?? 'sistema');
  const reduzirMovimento = useReduzirMovimento();
  const [veu, setVeu] = useState<string | null>(null);
  const [opacidade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let ativo = true;
    lerAparencia().then((salva) => ativo && salva && setPreferencia(salva));
    return () => {
      ativo = false;
    };
  }, []);

  const escuro = preferencia === 'sistema' ? sistema === 'dark' : preferencia === 'escuro';

  const definir = useCallback(
    (nova: Aparencia) => {
      if (nova === preferencia) return;
      const aplicar = () => {
        setPreferencia(nova);
        void salvarAparencia(nova);
      };
      const ficaEscuro = nova === 'sistema' ? sistema === 'dark' : nova === 'escuro';
      if (ficaEscuro === escuro || reduzirMovimento) return aplicar();
      if (transicaoSuave(aplicar)) return;

      // véu com o fundo do tema antigo que some devagar por cima do tema novo
      setVeu(escuro ? coresFundo.escuro : coresFundo.claro);
      opacidade.setValue(1);
      aplicar();
      Animated.timing(opacidade, {
        toValue: 0,
        duration: 460,
        easing: curvaApple,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => setVeu(null));
    },
    [preferencia, sistema, escuro, reduzirMovimento, opacidade],
  );

  const alternar = useCallback(() => definir(escuro ? 'claro' : 'escuro'), [definir, escuro]);

  const valor = useMemo(() => ({ preferencia, escuro, definir, alternar }), [preferencia, escuro, definir, alternar]);

  return (
    <ContextoAparencia value={valor}>
      <View style={{ flex: 1 }}>
        {children}
        {veu ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: veu, opacity: opacidade }]} /> : null}
      </View>
    </ContextoAparencia>
  );
}
