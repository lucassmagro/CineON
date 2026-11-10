// Respeita a opção "reduzir movimento" do sistema: sem ela, as animações ficam desligadas.
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';

// curva de desaceleração parecida com a que o iOS usa nas transições
export const curvaApple = Easing.bezier(0.2, 0, 0, 1);

export function useReduzirMovimento(): boolean {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => ativo && setReduzir(r));
    const assinatura = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzir);
    return () => {
      ativo = false;
      assinatura.remove();
    };
  }, []);
  return reduzir;
}
