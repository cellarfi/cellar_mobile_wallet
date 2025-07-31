import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import messaging from '@react-native-firebase/messaging';

export type sessionInfoType = {
  device_name: string | null;
  device_model: string | null;
  device_id: string | null;
  device_os: string | null;
  device_platform: string;
  ip_address: string | null;
  expo_push_token: string | null
};

export const sessionInfo = async (): Promise<sessionInfoType> => {

  // FCM Info
  await messaging().registerDeviceForRemoteMessages(); // Register the device with FCm
  const token = await messaging().getToken(); // Get the Token for FCM
  const expo_push_token = token;

  // Device Info
  const device_name = Device.deviceName ?? null;
  const device_model = Device.modelName ?? null;
  const device_id = Device.modelId ?? null;
  const device_os = Device.osName ?? null;
  const device_platform = Platform.OS;

  // Network Info
  const ip_address = await Network.getIpAddressAsync();

  return {
    device_name,
    device_model,
    device_id,
    device_os,
    device_platform,
    ip_address,
    expo_push_token
  };
};
