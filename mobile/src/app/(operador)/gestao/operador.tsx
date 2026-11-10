import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { mensagemDe } from '@/services/api';
import { authService } from '@/services/cineon';
import { Botao, Campo, Secao, Tela, TextoErro } from '@/ui/componentes';
import { useMargem } from '@/ui/tema';
import { avisar } from '@/utils/dialogos';

export default function NovoOperador() {
  const router = useRouter();
  const margem = useMargem();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (nome.trim().length < 2) return setErro('Informe o nome');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErro('Informe um e-mail válido');
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres');
    setSalvando(true);
    setErro(null);
    try {
      await authService.criarOperador({ nome: nome.trim(), email: email.trim(), senha });
      avisar('Operador criado', `${nome.trim()} já pode entrar no app.`);
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela>
      <Secao nota="Operadores acessam a bilheteria, a validação de entrada e a gerência.">
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} placeholder="Nome completo" />
        <Campo rotulo="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="nome@cineon.com" />
        <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="new-password" placeholder="Senha inicial" ultima />
      </Secao>
      <TextoErro texto={erro} />
      <View style={{ paddingHorizontal: margem }}>
        <Botao titulo="Criar operador" aoTocar={salvar} carregando={salvando} />
      </View>
    </Tela>
  );
}
