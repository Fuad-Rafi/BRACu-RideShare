import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { CONFIG } from '@/constants/config';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.trim().toLowerCase().endsWith(`@${CONFIG.ALLOWED_DOMAIN}`)) {
      Alert.alert('Invalid Email', `Please use your BRAC University email (@${CONFIG.ALLOWED_DOMAIN})`);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    } else {
      setSession(data.session);
      setUser(data.user);
      router.replace('/(tabs)');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-20 pb-10">
          <View className="mb-12">
            <Text className="text-4xl font-bold text-secondary-900 mb-2">Welcome Back</Text>
            <Text className="text-lg text-secondary-500">Log in to coordinate your next ride.</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-secondary-700 font-medium mb-2">University Email</Text>
              <TextInput
                className="bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-4 text-secondary-900"
                placeholder="name@g.bracu.ac.bd"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View className="mt-4">
              <Text className="text-secondary-700 font-medium mb-2">Password</Text>
              <TextInput
                className="bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-4 text-secondary-900"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              className="bg-primary-500 rounded-2xl py-4 mt-8 flex-row justify-center items-center"
              onPress={signInWithEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-auto pt-10 flex-row justify-center">
            <Text className="text-secondary-500">Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text className="text-primary-500 font-bold">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
