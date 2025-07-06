import { Images } from '@/constants/Images'
import { Image } from 'expo-image'

interface AppLogoProps {
  size?: number
}

export default function AppLogo({ size = 128 }: AppLogoProps) {
  // Calculate text size based on logo size (approximately 1/3 of logo size)
  return <Image source={Images.appLogo} style={{ width: size, height: size }} />
}
