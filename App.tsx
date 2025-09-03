import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';


const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('Faltan variables EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON ?? '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// === Error Boundary súper simple ===
function Safe({ children }: { children: React.ReactNode }) {
  const [err, setErr] = useState<null | string>(null);
  useEffect(() => {
    const handler = (e: any) => setErr(String(e?.reason?.message ?? e?.message ?? e));
    const h2 = (e: any) => setErr(String(e?.message ?? e));
    // @ts-ignore
    globalThis.addEventListener?.('unhandledrejection', handler);
    // @ts-ignore
    globalThis.addEventListener?.('error', h2);
    return () => {
      // @ts-ignore
      globalThis.removeEventListener?.('unhandledrejection', handler);
      // @ts-ignore
      globalThis.removeEventListener?.('error', h2);
    };
  }, []);
  if (err) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Se capturó un error</Text>
        <Text selectable style={{ marginBottom: 16 }}>{err}</Text>
        <Text>Revisa .env, babel y newArchEnabled.</Text>
      </View>
    );
  }
  return <>{children}</>;
}

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setLogged(!!data.session);
        const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
          setLogged(!!session);
        });
        unsub = () => sub.subscription.unsubscribe();
      } catch (e: any) {
        Alert.alert('Error init', String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
    return () => unsub?.();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Safe>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Cambiar contraseña' }} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Safe>
  );
}
