import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { mensagemDe } from '@/services/api';
import { Botao, Campo, Grupo, TextoErro } from '@/ui/componentes';
import { cores, espaco, fonte } from '@/ui/tema';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (usuario) return <Redirect href="/" />;

  async function fazerLogin() {
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await entrar(email, senha);
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={estilos.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={estilos.marca}>
        <Text style={estilos.logo}>CineON</Text>
        <Text style={estilos.slogan}>Ingressos com lugar marcado</Text>
      </View>

      <Grupo>
        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          teclado="email-address"
          placeholder="voce@exemplo.com"
        />
        <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="password" onSubmitEditing={fazerLogin} ultima />
      </Grupo>
      <TextoErro texto={erro} />

      <View style={estilos.acoes}>
        <Botao titulo="Entrar" aoTocar={fazerLogin} carregando={enviando} />
        <Link href="/cadastro" style={estilos.link}>
          Não tem conta? Criar conta
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, justifyContent: 'center', backgroundColor: cores.fundo, paddingVertical: espaco.xxl },
  marca: { alignItems: 'center', marginBottom: espaco.xxl },
  logo: { fontSize: 40, fontWeight: '800', letterSpacing: -0.5 },
  slogan: { ...fonte.secundario, color: cores.textoSecundario, marginTop: 4 },
  acoes: { paddingHorizontal: espaco.l, gap: espaco.l },
  link: { ...fonte.corpo, color: cores.azul, textAlign: 'center' },
});
