import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ExploreScreen() {
  const { user } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const router = useRouter();
  
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchRides() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          creator:profiles(*)
        `)
        .eq('status', 'Open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRides(data || []);
    } catch (error: any) {
      console.error('Error fetching rides:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
      fetchRides();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRides();
  };

  const renderRideCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/ride/${item.id}`)}
      className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-secondary-100"
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <View className="w-2 h-2 rounded-full bg-primary-500 mr-2" />
            <Text className="text-secondary-500 text-xs font-medium uppercase tracking-wider">From</Text>
          </View>
          <Text className="text-secondary-900 font-bold text-lg" numberOfLines={1}>{item.from_location}</Text>
        </View>
        <View className="px-3 py-1 bg-primary-50 rounded-full">
          <Text className="text-primary-600 font-bold text-xs">{item.seats_available} Seats</Text>
        </View>
      </View>

      <View className="flex-row items-center mb-4">
        <View className="w-[1px] h-4 bg-secondary-200 ml-1 mr-4" />
        <IconSymbol name="chevron.down" size={16} color="#cbd5e1" />
      </View>

      <View className="mb-4">
        <View className="flex-row items-center mb-1">
          <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
          <Text className="text-secondary-500 text-xs font-medium uppercase tracking-wider">To</Text>
        </View>
        <Text className="text-secondary-900 font-bold text-lg" numberOfLines={1}>{item.destination}</Text>
      </View>

      <View className="h-[1px] bg-secondary-50 my-2" />

      <View className="flex-row justify-between items-center mt-2">
        <View className="flex-row items-center">
          <IconSymbol name="calendar" size={16} color="#64748b" />
          <Text className="text-secondary-500 ml-2 text-sm">{item.ride_date}</Text>
          <Text className="text-secondary-300 mx-2">•</Text>
          <IconSymbol name="clock" size={16} color="#64748b" />
          <Text className="text-secondary-500 ml-2 text-sm">{item.departure_time}</Text>
        </View>
        
        {item.women_only && (
          <View className="flex-row items-center bg-pink-50 px-2 py-1 rounded-lg">
            <IconSymbol name="person.2.fill" size={12} color="#db2777" />
            <Text className="text-pink-600 text-[10px] font-bold ml-1 uppercase">Women Only</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-secondary-50">
      <View className="bg-white px-6 pt-16 pb-6 shadow-sm">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-secondary-500 text-sm font-medium">Hello, {profile?.name?.split(' ')[0] || 'Student'}</Text>
            <Text className="text-2xl font-bold text-secondary-900">Find a Ride</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/profile')}
            className="w-12 h-12 rounded-full bg-secondary-100 overflow-hidden items-center justify-center border-2 border-primary-50"
          >
            {profile?.avatar_url ? (
              <View className="w-full h-full">
                <Text className="hidden">Avatar</Text>
                {/* Image component would go here */}
              </View>
            ) : (
              <IconSymbol name="person.fill" size={24} color="#3358ff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3358ff" />
        </View>
      ) : (
        <FlatList
          data={rides}
          renderItem={renderRideCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <IconSymbol name="car.fill" size={64} color="#e2e8f0" />
              <Text className="text-secondary-400 mt-4 text-lg">No rides available right now</Text>
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/create')}
                className="mt-6 bg-primary-500 px-6 py-3 rounded-2xl"
              >
                <Text className="text-white font-bold">Offer a Ride</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
