import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function RideDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  async function fetchRideDetails() {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          creator:profiles(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setRide(data);

      // Check if user already requested
      if (user) {
        const { data: requestData } = await supabase
          .from('join_requests')
          .select('status')
          .eq('ride_id', id)
          .eq('user_id', user.id)
          .single();
        
        if (requestData) setRequestStatus(requestData.status);
      }
    } catch (error: any) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRideDetails();
  }, [id]);

  async function handleJoinRequest() {
    if (!user || requesting) return;
    
    if (ride.creator_id === user.id) {
      Alert.alert('Note', 'This is your own ride.');
      return;
    }

    setRequesting(true);
    try {
      const { error } = await supabase
        .from('join_requests')
        .insert({
          ride_id: id,
          user_id: user.id,
          status: 'Pending'
        });

      if (error) throw error;
      
      setRequestStatus('Pending');
      Alert.alert('Success', 'Request sent to the creator!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setRequesting(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3358ff" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-secondary-500 text-lg">Ride not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary-500 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="bg-primary-500 pt-16 pb-10 px-6 rounded-b-[40px]">
          <TouchableOpacity onPress={() => router.back()} className="mb-6 w-10 h-10 bg-white/20 rounded-full items-center justify-center">
            <IconSymbol name="chevron.left" size={24} color="white" />
          </TouchableOpacity>
          
          <Text className="text-white/70 font-medium uppercase tracking-widest text-xs mb-2">Ride to</Text>
          <Text className="text-white text-3xl font-bold mb-4">{ride.destination}</Text>
          
          <View className="flex-row items-center">
            <View className="bg-white/20 px-3 py-1 rounded-lg flex-row items-center mr-3">
              <IconSymbol name="calendar" size={14} color="white" />
              <Text className="text-white ml-2 text-xs font-bold">{ride.ride_date}</Text>
            </View>
            <View className="bg-white/20 px-3 py-1 rounded-lg flex-row items-center">
              <IconSymbol name="clock" size={14} color="white" />
              <Text className="text-white ml-2 text-xs font-bold">{ride.departure_time}</Text>
            </View>
          </View>
        </View>

        <View className="px-6 py-8">
          <View className="flex-row items-center mb-8 bg-secondary-50 p-4 rounded-3xl">
            <View className="w-14 h-14 bg-secondary-200 rounded-2xl overflow-hidden items-center justify-center">
              {ride.creator?.avatar_url ? (
                <Image source={{ uri: ride.creator.avatar_url }} className="w-full h-full" />
              ) : (
                <IconSymbol name="person.fill" size={32} color="#64748b" />
              )}
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-secondary-900 font-bold text-lg">{ride.creator?.name || 'Student'}</Text>
              <Text className="text-secondary-500 text-sm">{ride.creator?.department || 'University Student'}</Text>
            </View>
            <TouchableOpacity className="bg-primary-50 p-2 rounded-xl">
              <IconSymbol name="message.fill" size={20} color="#3358ff" />
            </TouchableOpacity>
          </View>

          <View className="space-y-6">
            <View className="flex-row" style={{ gap: 20 }}>
              <View className="flex-1 bg-secondary-50 p-4 rounded-2xl">
                <Text className="text-secondary-500 text-xs font-medium mb-1 uppercase">Vehicle</Text>
                <Text className="text-secondary-900 font-bold">{ride.vehicle_type}</Text>
              </View>
              <View className="flex-1 bg-secondary-50 p-4 rounded-2xl">
                <Text className="text-secondary-500 text-xs font-medium mb-1 uppercase">Available</Text>
                <Text className="text-secondary-900 font-bold">{ride.seats_available} Seats</Text>
              </View>
            </View>

            <View className="bg-secondary-50 p-4 rounded-2xl mt-4">
              <Text className="text-secondary-500 text-xs font-medium mb-2 uppercase">From</Text>
              <Text className="text-secondary-900 font-bold text-lg">{ride.from_location}</Text>
            </View>

            <View className="bg-secondary-50 p-4 rounded-2xl mt-4">
              <Text className="text-secondary-500 text-xs font-medium mb-2 uppercase">Notes</Text>
              <Text className="text-secondary-700 leading-6">{ride.notes || 'No extra notes provided by the creator.'}</Text>
            </View>

            {ride.women_only && (
              <View className="flex-row items-center bg-pink-50 p-4 rounded-2xl mt-4 border border-pink-100">
                <IconSymbol name="person.2.fill" size={24} color="#db2777" />
                <View className="ml-4 flex-1">
                  <Text className="text-pink-600 font-bold uppercase text-xs">Women Only Ride</Text>
                  <Text className="text-pink-500 text-xs">This ride is restricted to female students only.</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View className="p-6 border-t border-secondary-100">
        {requestStatus === 'Accepted' ? (
          <TouchableOpacity 
            onPress={() => router.push(`/chat/${ride.id}`)}
            className="bg-green-500 rounded-2xl py-4 flex-row justify-center items-center"
          >
            <Text className="text-white font-bold text-lg">Open Group Chat</Text>
          </TouchableOpacity>
        ) : requestStatus === 'Pending' ? (
          <View className="bg-secondary-100 rounded-2xl py-4 flex-row justify-center items-center">
            <Text className="text-secondary-500 font-bold text-lg">Request Pending</Text>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={handleJoinRequest}
            disabled={requesting || ride.creator_id === user?.id}
            className={`rounded-2xl py-4 flex-row justify-center items-center shadow-lg ${
              ride.creator_id === user?.id ? 'bg-secondary-200 shadow-none' : 'bg-primary-500 shadow-primary-200'
            }`}
          >
            {requesting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {ride.creator_id === user?.id ? 'Your Ride' : 'Request to Join'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
