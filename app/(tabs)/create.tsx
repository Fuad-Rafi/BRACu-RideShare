import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function CreateRideScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState('3');
  const [vehicle, setVehicle] = useState('Car');
  const [notes, setNotes] = useState('');
  const [womenOnly, setWomenOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreateRide() {
    if (!from || !to || !date || !time || !seats || !vehicle) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('rides').insert({
        creator_id: user.id,
        from_location: from,
        destination: to,
        ride_date: date,
        departure_time: time,
        seats_available: parseInt(seats),
        vehicle_type: vehicle,
        notes: notes,
        women_only: womenOnly,
        status: 'Open',
      });

      if (error) throw error;

      Alert.alert('Success', 'Ride created successfully!', [
        { text: 'OK', onPress: () => router.push('/(tabs)') }
      ]);
      
      // Reset form
      setFrom('');
      setTo('');
      setDate('');
      setTime('');
      setNotes('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-10">
          <Text className="text-3xl font-bold text-secondary-900 mb-8">Post a Ride</Text>

          <View className="space-y-5">
            <View>
              <Text className="text-secondary-500 font-medium mb-2">From</Text>
              <View className="flex-row items-center bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-1">
                <IconSymbol name="location.fill" size={20} color="#64748b" />
                <TextInput
                  className="flex-1 ml-2 py-3 text-secondary-900"
                  placeholder="e.g. BRACU Residential Campus"
                  value={from}
                  onChangeText={setFrom}
                />
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-secondary-500 font-medium mb-2">Destination</Text>
              <View className="flex-row items-center bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-1">
                <IconSymbol name="flag.fill" size={20} color="#64748b" />
                <TextInput
                  className="flex-1 ml-2 py-3 text-secondary-900"
                  placeholder="e.g. Mohakhali"
                  value={to}
                  onChangeText={setTo}
                />
              </View>
            </View>

            <View className="flex-row mt-4" style={{ gap: 15 }}>
              <View className="flex-1">
                <Text className="text-secondary-500 font-medium mb-2">Date</Text>
                <TextInput
                  className="bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-4 text-secondary-900"
                  placeholder="YYYY-MM-DD"
                  value={date}
                  onChangeText={setDate}
                />
              </View>
              <View className="flex-1">
                <Text className="text-secondary-500 font-medium mb-2">Time</Text>
                <TextInput
                  className="bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-4 text-secondary-900"
                  placeholder="HH:MM"
                  value={time}
                  onChangeText={setTime}
                />
              </View>
            </View>

            <View className="flex-row mt-4" style={{ gap: 15 }}>
              <View className="flex-1">
                <Text className="text-secondary-500 font-medium mb-2">Seats</Text>
                <TextInput
                  className="bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-4 text-secondary-900"
                  placeholder="Available seats"
                  value={seats}
                  onChangeText={setSeats}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Text className="text-secondary-500 font-medium mb-2">Vehicle</Text>
                <TextInput
                  className="bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-4 text-secondary-900"
                  placeholder="Car, Bike, etc."
                  value={vehicle}
                  onChangeText={setVehicle}
                />
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-secondary-500 font-medium mb-2">Notes (Optional)</Text>
              <TextInput
                className="bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-4 text-secondary-900 min-h-[100px]"
                placeholder="e.g. Split cost, non-smoking, etc."
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View className="flex-row items-center justify-between bg-primary-50 p-4 rounded-2xl mt-4">
              <View className="flex-1 pr-4">
                <Text className="text-primary-900 font-bold">Women Only Ride</Text>
                <Text className="text-primary-700 text-xs">Only female students will see this ride.</Text>
              </View>
              <Switch
                value={womenOnly}
                onValueChange={setWomenOnly}
                trackColor={{ false: '#d1d5db', true: '#bcd0ff' }}
                thumbColor={womenOnly ? '#3358ff' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity
              onPress={handleCreateRide}
              disabled={loading}
              className="bg-primary-500 rounded-2xl py-4 mt-8 flex-row justify-center items-center shadow-lg shadow-primary-200"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Create Ride</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
