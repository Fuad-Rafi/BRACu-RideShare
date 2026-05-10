import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { IconSymbol } from '@/components/ui/icon-symbol';

import { Avatar } from '@/components/Avatar';

const GENDERS = ['Male', 'Female', 'Other'];

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { profile, loading, fetchProfile, updateProfile } = useProfileStore();
  
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [studentId, setStudentId] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setDept(profile.department || '');
      setStudentId(profile.student_id || '');
      setGender(profile.gender);
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  async function handleSave() {
    if (!name || !dept || !studentId || !gender) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSaving(true);
    const { error } = await updateProfile({
      name,
      department: dept,
      student_id: studentId,
      gender,
      avatar_url: avatarUrl,
    });

    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Failed to update profile');
    } else {
      Alert.alert('Success', 'Profile updated successfully');
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) signOut();
  }

  if (loading && !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3358ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-10">
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-3xl font-bold text-secondary-900">Profile</Text>
            <TouchableOpacity onPress={handleLogout} className="p-2 bg-red-50 rounded-full">
              <IconSymbol name="chevron.right" size={24} color="#ef4444" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Avatar Component */}
          <View className="mb-10">
            <Avatar url={avatarUrl} onUpload={setAvatarUrl} />
            <Text className="text-center mt-2 text-secondary-500">Tap to change photo</Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-secondary-500 font-medium mb-2">Full Name</Text>
              <TextInput
                className="bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-4 text-secondary-900"
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="mt-4">
              <Text className="text-secondary-500 font-medium mb-2">Department</Text>
              <TextInput
                className="bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-4 text-secondary-900"
                placeholder="CSE, EEE, etc."
                value={dept}
                onChangeText={setDept}
              />
            </View>

            <View className="mt-4">
              <Text className="text-secondary-500 font-medium mb-2">Student ID (RS Number)</Text>
              <TextInput
                className="bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-4 text-secondary-900"
                placeholder="21101XXX"
                value={studentId}
                onChangeText={setStudentId}
                keyboardType="numeric"
              />
            </View>

            <View className="mt-4">
              <Text className="text-secondary-500 font-medium mb-2">Gender</Text>
              <View className="flex-row" style={{ gap: 10 }}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    className={`flex-1 py-3 rounded-xl border items-center ${
                      gender === g 
                        ? 'bg-primary-500 border-primary-500' 
                        : 'bg-white border-secondary-200'
                    }`}
                  >
                    <Text className={`font-semibold ${gender === g ? 'text-white' : 'text-secondary-700'}`}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="bg-primary-500 rounded-2xl py-4 mt-10 flex-row justify-center items-center shadow-lg shadow-primary-200"
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Save Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
