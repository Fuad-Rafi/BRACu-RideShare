import React, { useState } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface AvatarProps {
  url: string | null;
  onUpload: (url: string) => void;
  size?: number;
}

export function Avatar({ url, onUpload, size = 120 }: AvatarProps) {
  const [uploading, setUploading] = useState(false);

  async function uploadAvatar() {
    try {
      setUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const image = result.assets[0];
      const fileExt = image.uri.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const formData = new FormData();
      formData.append('file', {
        uri: image.uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View className="items-center">
      <TouchableOpacity 
        onPress={uploadAvatar}
        disabled={uploading}
        style={{ width: size, height: size }}
        className="bg-primary-100 rounded-full items-center justify-center border-4 border-primary-50 overflow-hidden"
      >
        {url ? (
          <Image source={{ uri: url }} style={{ width: size, height: size }} />
        ) : (
          <IconSymbol name="person.fill" size={size * 0.5} color="#3358ff" />
        )}
        
        {uploading && (
          <View className="absolute inset-0 bg-black/30 items-center justify-center">
            <ActivityIndicator color="white" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
