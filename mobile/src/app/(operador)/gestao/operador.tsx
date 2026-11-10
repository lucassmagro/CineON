import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { mensagemDe } from '@/services/api';
import { authService } from '@/services/cineon';
import { Botao, Campo, Grupo, Tela, TextoErro } from '@/ui/componentes';
import { espaco } from '@/ui/tema';
import { avisar } from '@/utils/dialogos';

export default function NovoOperador() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (nome.trim().length < 2) return setErro('Informe o nome');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErro('Informe um e-mail válido');
    if (senha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres');
    setSalvando(true);
    setErro(null);
    try {
      await authService.criarOperador({ nome: nome.trim(), email: email.trim(), senha });
      avisar('Operador criado', `${nome.trim()} já pode entrar no aplicativo.`);
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela>
      <Grupo nota="Operadores têm acesso à bilheteria e à gerência.">
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} />
        <Campo rotulo="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} teclado="email-address" />
        <Campo rotulo="Senha inicial" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="new-password" ultima />
      </Grupo>
      <TextoErro texto={erro} />
      <View style={{ paddingHorizontal: espaco.l }}>
        <Botao titulo="Criar operador" aoTocar={salvar} carregando={salvando} />
      </View>
    </Tela>
  );
}
