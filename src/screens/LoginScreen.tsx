import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ImageBackground, Image, Dimensions, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Auth: undefined;
};
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // LOGIN
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return Alert.alert('Login error', error.message);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  // REGISTRO
  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert('Error', 'Completa todos los campos');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Las contraseñas no coinciden');
    }
    // Registro en auth con metadata (sin rol, el trigger asigna 'cliente' por defecto)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    });
    if (error) return Alert.alert('SignUp error', error.message);

    Alert.alert('Revisa tu correo', 'Confirma tu cuenta para continuar.');
    setIsSignUp(false);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    navigation.navigate('Login');
  };

  return (
    <ImageBackground
      source={require('../../assets/logo1.jpg')}
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/Imagen1.jpg')} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.cardContainer}>
          <View style={styles.rowBtns}>
            <TouchableOpacity
              style={[styles.switchBtn, !isSignUp && styles.activeSwitchBtn]}
              onPress={() => setIsSignUp(false)}
            >
              <Text style={[styles.switchBtnText, !isSignUp && styles.activeSwitchBtnText]}>LOG IN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.switchBtn, isSignUp && styles.activeSwitchBtn]}
              onPress={() => setIsSignUp(true)}
            >
              <Text style={[styles.switchBtnText, isSignUp && styles.activeSwitchBtnText]}>SIGN UP</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.welcome}>Welcome to CuidaColitas</Text>
          {isSignUp && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  placeholder="Nombre completo"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  placeholderTextColor="#6C6464"
                />
                <View style={styles.line} />
              </View>
            </>
          )}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              placeholder="Correo"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholderTextColor="#6C6464"
            />
            <View style={styles.line} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#6C6464"
            />
            <View style={styles.line} />
          </View>
          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <TextInput
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={styles.input}
                placeholderTextColor="#6C6464"
              />
              <View style={styles.line} />
            </View>
          )}
          <TouchableOpacity
            style={isSignUp ? styles.signupBtn : styles.loginBtn}
            onPress={isSignUp ? handleSignUp : handleLogin}
          >
            <Text style={isSignUp ? styles.signupBtnText : styles.loginBtnText}>
              {isSignUp ? 'REGISTRARME' : 'ENTRAR'}
            </Text>
          </TouchableOpacity>
          {!isSignUp && (
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  rowBtns: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchBtn: {
    flex: 1,
    backgroundColor: '#E2ECED',
    borderRadius: 40,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#91FFD5',
  },
  
  activeSwitchBtn: {
    backgroundColor: '#91FFD5',
    borderColor: '#1CEA9B',
  },
  switchBtnText: {
    fontFamily: 'Montserrat',
    fontWeight: '700',
    fontSize: 18,
    color: '#000',
  },
  activeSwitchBtnText: {
    textDecorationLine: 'underline',
    color: '#000',
  },
  bg: {
    flex: 1,
    backgroundColor: '#CEB286',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 77,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 10,
  },
  logo: {
    width: 167,
    height: 42,
  },
  cardContainer: {
    backgroundColor: '#E2ECED',
    borderRadius: 40,
    marginHorizontal: 24,
    padding: 24,
    marginTop: 155,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  welcome: {
    fontFamily: 'Montserrat',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 29,
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 18,
  },
  label: {
    fontFamily: 'Lora',
    fontWeight: '600',
    fontSize: 20,
    color: '#6C6464',
    marginBottom: 2,
    marginLeft: 8,
  },
  input: {
    width: '100%',
    fontSize: 16,
    color: '#000',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  line: {
    width: '100%',
    height: 1,
    backgroundColor: '#000',
    marginTop: -2,
    marginBottom: 2,
  },
  loginBtn: {
    width: '90%',
    backgroundColor: '#1CEA9B',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  loginBtnText: {
    fontFamily: 'Montserrat',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 29,
    textDecorationLine: 'underline',
    color: '#000',
  },
  signupBtn: {
    width: '90%',
    backgroundColor: '#1CEA9B',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 8,
    alignSelf: 'center',
  },
  signupBtnText: {
    fontFamily: 'Montserrat',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 29,
    color: '#000',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  forgotBtn: {
    marginTop: 12,
    alignSelf: 'center',
  },
  forgotText: {
    fontFamily: 'Montserrat',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 18,
    color: '#000',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  picker: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    color: '#000',
    paddingHorizontal: 12,
  }
});
