import CustomButton from '@/components/ui/CustomButton'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import * as Linking from 'expo-linking'
import React, { useState } from 'react'
import { Modal, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface TransactionSuccessModalProps {
  visible: boolean
  txSignature?: string
  onClose: () => void
}

export default function TransactionSuccessModal({
  visible,
  txSignature,
  onClose,
}: TransactionSuccessModalProps) {
  const [txHashCopied, setTxHashCopied] = useState(false)

  const handleViewOnSolscan = () => {
    if (txSignature) {
      const url = `https://solscan.io/tx/${txSignature}`
      Linking.openURL(url)
    }
  }

  const copyTransactionHash = async () => {
    if (!txSignature) return

    try {
      await Clipboard.setStringAsync(txSignature)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      setTxHashCopied(true)

      // Reset copied state after 2 seconds
      setTimeout(() => setTxHashCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy transaction hash:', error)
    }
  }

  const formatSignature = (signature: string) => {
    if (!signature) return ''
    return `${signature.slice(0, 8)}...${signature.slice(-8)}`
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType='slide'
      statusBarTranslucent
    >
      <SafeAreaView className='flex-1 bg-dark-50'>
        <View className='flex-1 justify-center items-center px-6'>
          {/* Success Icon */}
          <View className='w-24 h-24 bg-green-500/20 rounded-full justify-center items-center mb-8'>
            <Ionicons name='checkmark-circle' size={64} color='#22c55e' />
          </View>

          {/* Success Message */}
          <Text className='text-white text-2xl font-bold text-center mb-4'>
            Transaction Successful!
          </Text>

          <Text className='text-gray-400 text-center mb-8 leading-6'>
            Your transaction has been successfully submitted to the Solana
            network.
          </Text>

          {/* Transaction Details */}
          {txSignature && (
            <View className='bg-dark-200 rounded-2xl p-6 mb-8 w-full'>
              <Text className='text-white font-semibold mb-3'>
                Transaction Hash
              </Text>
              <View className='flex-row items-center justify-between'>
                <Text className='text-gray-400 font-mono flex-1 mr-3'>
                  {formatSignature(txSignature)}
                </Text>
                <TouchableOpacity
                  onPress={copyTransactionHash}
                  className='bg-primary-500/20 px-4 py-2 rounded-lg flex-row items-center'
                >
                  <Ionicons name='copy' size={16} color='#6366f1' />
                  <Text className='text-primary-400 ml-2 font-medium'>
                    {txHashCopied ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View className='w-full gap-4'>
            {txSignature && (
              <CustomButton
                text='View on Solscan'
                onPress={handleViewOnSolscan}
                icon='open-outline'
                type='secondary'
              />
            )}

            <CustomButton text='Done' onPress={onClose} icon='checkmark' />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
