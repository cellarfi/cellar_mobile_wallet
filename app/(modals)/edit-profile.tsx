import CustomButton from '@/components/ui/CustomButton';
import CustomTextInput from '@/components/ui/CustomTextInput';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { userRequests } from '@/libs/api_requests/user.request';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

const editProfileSchema = z.object({
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be 50 characters or less')
    .regex(
      /^[a-zA-Z0-9\s._-]+$/,
      'Only letters, numbers, spaces, dots, underscores, and hyphens allowed'
    ),
  tag_name: z
    .string()
    .min(3, 'Tag name must be at least 3 characters')
    .max(20, 'Tag name must be 20 characters or less')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Only letters, numbers, underscores, and hyphens allowed'
    )
    .refine((val) => !val.startsWith('_') && !val.endsWith('_'), {
      message: 'Tag name cannot start or end with underscore',
    }),
});

const EditProfileModal = () => {
  const { profile, setProfile } = useAuthStore();
  const [formData, setFormData] = useState({
    display_name: '',
    tag_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingTag, setIsCheckingTag] = useState(false);
  const [tagNameAvailable, setTagNameAvailable] = useState<boolean | null>(
    null
  );

  // Initialize form with current profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        tag_name: profile.tag_name || '',
      });
    }
  }, [profile]);

  // Debounced tag name check
  const debouncedCheckTagName = useDebouncedCallback(
    async (tagName: string) => {
      await checkTagName(tagName);
    },
    500
  );

  const updateFormData = (field: string, value: string) => {
    const newValue = field === 'tag_name' ? value.toLowerCase() : value;

    setFormData((prev) => ({
      ...prev,
      [field]: newValue,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }

    // Handle tag name validation
    if (field === 'tag_name') {
      setTagNameAvailable(null);
      debouncedCheckTagName(newValue);
    }
  };

  const validateForm = () => {
    try {
      if (tagNameAvailable === false) {
        setErrors((prev) => ({
          ...prev,
          tag_name:
            'This tag name is already taken. Please choose another one.',
        }));
        return false;
      }

      editProfileSchema.parse(formData);

      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!profile) return;

    // Don't submit if tag name is being checked
    if (isCheckingTag) {
      Alert.alert('Please wait', 'Checking tag name availability...');
      return;
    }

    setIsLoading(true);
    try {
      const response = await userRequests.updateProfile({
        display_name: formData.display_name.trim(),
        tag_name: formData.tag_name.trim().toLowerCase(),
      });

      if (response.success && response.data) {
        // Update profile in store
        setProfile(response.data);

        // Show success message
        Alert.alert('Success', 'Your profile has been updated successfully');

        // Go back to profile
        router.dismiss();
      } else {
        Alert.alert(
          'Error',
          response.message || 'Failed to update profile. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        error?.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const checkTagName = async (tagName: string) => {
    // Skip check if tag name is invalid
    if (tagName.length < 3) {
      setTagNameAvailable(null);
      return;
    }

    // Skip check if the tag name hasn't changed
    if (profile?.tag_name?.toLowerCase() === tagName.toLowerCase()) {
      setTagNameAvailable(true);
      return;
    }

    try {
      setIsCheckingTag(true);
      const response = await userRequests.checkTagNameExists(tagName);
      const isAvailable = !response.data?.exists;
      setTagNameAvailable(isAvailable);

      if (!response.data?.exists) {
        // Clear the error if the tag name becomes available
        const { tag_name, ...rest } = errors;
        setErrors(rest);
      }
      return isAvailable;
    } catch (error) {
      console.error('Error checking tag name:', error);
      // On error, we'll assume the tag is available to avoid blocking the user
      setTagNameAvailable(true);
      return true;
    } finally {
      setIsCheckingTag(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <LinearGradient
        colors={['#0a0a0b', '#1a1a1f', '#0a0a0b']}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className="flex-row items-center justify-between p-4 border-b border-dark-200">
            <TouchableOpacity onPress={() => router.dismiss()} className="p-2">
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">
              Edit Profile
            </Text>
            <View className="w-10" />
          </View>

          <ScrollView
            className="flex-1 px-6 pt-6"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-6">
              {/* Display Name Input */}
              <View>
                <CustomTextInput
                  label="Display Name"
                  icon="person-outline"
                  placeholder="Enter your display name"
                  value={formData.display_name}
                  onChangeText={(text) => updateFormData('display_name', text)}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                {errors.display_name && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.display_name}
                  </Text>
                )}
              </View>

              {/* Tag Name Input */}
              <View>
                <CustomTextInput
                  label="Tag Name"
                  icon="at-outline"
                  placeholder="Enter your tag name"
                  value={formData.tag_name}
                  onChangeText={(text) => updateFormData('tag_name', text)}
                  autoCapitalize="none"
                  returnKeyType="done"
                  maxLength={20}
                />
                <View className="flex-row items-center justify-between mt-1">
                  <Text className="text-gray-500 text-xs">
                    This will be your unique identifier (like @
                    {formData.tag_name || 'username'})
                  </Text>
                  {isCheckingTag ? (
                    <Text className="text-yellow-500 text-xs">Checking...</Text>
                  ) : tagNameAvailable === true ? (
                    <Text className="text-green-500 text-xs">Available!</Text>
                  ) : tagNameAvailable === false ? (
                    <Text className="text-red-500 text-xs">Not available</Text>
                  ) : null}
                </View>
                {errors.tag_name && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.tag_name}
                  </Text>
                )}
              </View>
            </View>

            <CustomButton
              text={isLoading ? 'Saving...' : 'Save Changes'}
              onPress={handleSubmit}
              type="primary"
              className="mt-8 mb-6"
              disabled={isLoading}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default EditProfileModal;
