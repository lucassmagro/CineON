import { Redirect, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { mensagemDe } from '@/services/api';
import { authService } from '@/services/cineon';
import { BotaoTema } from '@/ui/BotaoTema';
import { Botao, Campo, Secao, Texto, TextoErro } from '@/ui/componentes';
import { espaco, useMargem, useTema } from '@/ui/tema';

export default function Cadastro() {
  const { usuario, entrar } = useAuth();
  const c = useTema();
  const margem = useMargem();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (usuario) return <Redirect href="/" />;

  async function criarConta() {
    if (nome.trim().length < 2) return setErro('Informe seu nome');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErro('Informe um e-mail válido');
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres');
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.fundo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{ headerShown: true, title: '', headerShadowVisible: false, headerStyle: { backgroundColor: c.fundo }, headerTintColor: c.azul, headerBackTitle: 'Entrar', headerRight: () => <BotaoTema /> }}
      />
      <ScrollView contentContainerStyle={{ paddingVertical: espaco.l }} keyboardShouldPersistTaps="handled">
        <View style={estilos.coluna}>
          <View style={[estilos.titulo, { paddingHorizontal: margem }]}>
            <Texto tipo="tituloGrande">Criar conta</Texto>
            <Texto tipo="subtitulo" cor="secundario">
              Com a conta você compra ingressos e encontra todos eles no app.
            </Texto>
          </View>
          <Secao nota="Use pelo menos 6 caracteres na senha.">
            <Campo rotulo="Nome" value={nome} onChangeText={setNome} autoComplete="name" placeholder="Seu nome" />
            <Campo rotulo="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="voce@exemplo.com" />
            <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="new-password" placeholder="Crie uma senha" onSubmitEditing={criarConta} ultima />
          </Secao>
          <TextoErro texto={erro} />
          <View style={{ paddingHorizontal: margem }}>
            <Botao titulo="Criar conta" aoTocar={criarConta} carregando={enviando} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  coluna: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  titulo: { marginBottom: espaco.xxl, gap: 4 },
});
