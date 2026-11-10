import { Redirect, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { mensagemDe } from '@/services/api';
import { authService } from '@/services/cineon';
import { Botao, Campo, Grupo, TextoErro, TituloGrande } from '@/ui/componentes';
import { cores, espaco } from '@/ui/tema';

export default function Cadastro() {
  const { usuario, entrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (usuario) return <Redirect href="/" />;

  async function criarConta() {
    if (nome.trim().length < 2) return setErro('Informe seu nome');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErro('Informe um e-mail válido');
    if (senha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres');
    setEnviando(true);
    setErro(null);
    try {
      await authService.cadastrar({ nome: nome.trim(), email: email.trim(), senha });
      await entrar(email, senha);
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={estilos.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: true, title: '', headerShadowVisible: false, headerStyle: { backgroundColor: cores.fundo } }} />
      <TituloGrande texto="Criar conta" subtitulo="Compre ingressos e escolha seu lugar." />
      <Grupo nota="A senha deve ter pelo menos 6 caracteres.">
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} autoComplete="name" placeholder="Seu nome" />
        <Campo rotulo="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} teclado="email-address" placeholder="voce@exemplo.com" />
        <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="new-password" ultima />
      </Grupo>
      <TextoErro texto={erro} />
      <View style={{ paddingHorizontal: espaco.l }}>
        <Botao titulo="Criar conta" aoTocar={criarConta} carregando={enviando} />
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, paddingTop: espaco.l },
});
