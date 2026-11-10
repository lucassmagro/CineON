import { useEffect, useState } from 'react';

// o React Compiler reclama de Date.now() no render, então o "agora" fica num state
export function useAgora(intervaloMs = 1000): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(timer);
  }, [intervaloMs]);
  return agora;
}

export function useContagem(limite: string | null | undefined): number {
  const agora = useAgora(1000);
  return limite ? new Date(limite).getTime() - agora : 0;
}
