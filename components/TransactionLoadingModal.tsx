import CreativeLoader from '@/components/ui/CreativeLoader'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { Modal, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface TransactionLoadingModalProps {
  visible: boolean
  label?: string
}

export default function TransactionLoadingModal({
  visible,
  label = 'Processing transaction...',
}: TransactionLoadingModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType='fade'
      statusBarTranslucent
    >
      <SafeAreaView className='flex-1 bg-dark-50'>
        <LinearGradient
          colors={['#0a0a0b', '#1a1a1f', '#0a0a0b']}
          style={{ flex: 1 }}
        >
          <View className='flex-1 justify-center items-center px-6'>
            <CreativeLoader label={label} logoSize={100} />
          </View>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  )
}
