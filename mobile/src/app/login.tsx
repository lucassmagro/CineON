import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Marca } from '@/components/Marca';
import { useAuth } from '@/contexts/AuthContext';
import { mensagemDe } from '@/services/api';
import { BotaoTema } from '@/ui/BotaoTema';
import { Botao, Campo, Secao, TextoErro } from '@/ui/componentes';
import { espaco, useMargem, useTema } from '@/ui/tema';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const router = useRouter();
  const c = useTema();
  const margem = useMargem();
  const margens = useSafeAreaInsets();
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.fundo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <View style={estilos.coluna}>
          <Marca subtitulo="Escolha o seu lugar e garanta o ingresso." />

          <Secao estilo={{ marginTop: espaco.xxxl, marginBottom: espaco.m }}>
            <Campo
              rotulo="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              placeholder="voce@exemplo.com"
              returnKeyType="next"
            />
            <Campo
              rotulo="Senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              autoComplete="password"
              placeholder="Obrigatória"
              onSubmitEditing={fazerLogin}
              returnKeyType="go"
              ultima
            />
          </Secao>
          <TextoErro texto={erro} />

          <View style={[estilos.acoes, { paddingHorizontal: margem }]}>
            <Botao titulo="Entrar" aoTocar={fazerLogin} carregando={enviando} />
            <Botao titulo="Criar uma conta" variante="simples" compacto aoTocar={() => router.push('/cadastro')} />
          </View>
        </View>
      </ScrollView>
      <View style={[estilos.tema, { top: margens.top + espaco.m, right: margem }]}>
        <BotaoTema />
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { flexGrow: 1, justifyContent: 'center', paddingVertical: espaco.xxxl },
  coluna: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  acoes: { gap: espaco.s },
  tema: { position: 'absolute' },
});
