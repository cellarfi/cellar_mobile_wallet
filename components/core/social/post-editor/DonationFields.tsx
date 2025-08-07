import React from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'

interface DonationFieldsProps {
  targetAmount: string
  deadline?: string
  onFieldChange: (field: string, value: string) => void
  fieldErrors?: Record<string, string>
  disabled?: boolean
}

const DonationFields: React.FC<DonationFieldsProps> = ({
  targetAmount,
  deadline,
  onFieldChange,
  fieldErrors = {},
  disabled = false,
}) => {
  const [showDeadlinePicker, setShowDeadlinePicker] = React.useState(false)

  const handleDeadlineConfirm = (date: Date) => {
    setShowDeadlinePicker(false)
    onFieldChange('deadline', date.toISOString())
  }

  const handleDeadlineCancel = () => {
    setShowDeadlinePicker(false)
  }

  return (
    <View>
      {/* Auto-Populated Info Display */}
      <View className='bg-secondary-light/50 rounded-xl p-4 mb-3'>
        <Text className='text-gray-300 text-sm mb-2'>📋 Donation Details</Text>
        <View className='flex-row items-center mb-2'>
          <Text className='text-gray-400 text-sm'>💰 Token: </Text>
          <Text className='text-white text-sm font-medium'>
            USDC (USD Coin)
          </Text>
        </View>
        {/* <View className='flex-row items-center mb-2'>
          <Text className='text-gray-400 text-sm'>⛓️ Chain: </Text>
          <Text className='text-white text-sm font-medium'>Solana</Text>
        </View>
        <View className='flex-row items-center'>
          <Text className='text-gray-400 text-sm'>👛 Wallet: </Text>
          <Text className='text-white text-sm font-medium'>
            Your active wallet
          </Text>
        </View> */}
      </View>

      {/* Target Amount */}
      <View className='mb-3'>
        <Text className='text-gray-300 text-sm mb-2'>Target Amount (USDC)</Text>
        <TextInput
          className='bg-secondary-light text-white rounded-xl px-4 py-3'
          placeholder='Enter target amount in USDC'
          placeholderTextColor='#888'
          keyboardType='numeric'
          value={targetAmount}
          onChangeText={(v) => onFieldChange('targetAmount', v)}
          editable={!disabled}
          style={{
            borderWidth: fieldErrors?.target_amount ? 1 : 0,
            borderColor: fieldErrors?.target_amount ? '#ef4444' : undefined,
            opacity: disabled ? 0.7 : 1,
          }}
        />
        {fieldErrors?.target_amount && (
          <Text className='text-red-500 mt-1 text-sm'>
            {fieldErrors.target_amount}
          </Text>
        )}
      </View>

      {/* Deadline */}
      <View className='mb-2'>
        <Text className='text-gray-300 text-sm mb-2'>Deadline (Optional)</Text>
        <TouchableOpacity
          className='bg-secondary-light rounded-xl px-4 py-3'
          onPress={() => setShowDeadlinePicker(true)}
          disabled={disabled}
          style={{
            opacity: disabled ? 0.7 : 1,
          }}
        >
          <Text className={`${deadline ? 'text-white' : 'text-[#888]'}`}>
            {deadline
              ? new Date(deadline).toLocaleDateString()
              : 'Set deadline (optional)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={showDeadlinePicker}
        mode='datetime'
        date={deadline ? new Date(deadline) : new Date()}
        onConfirm={handleDeadlineConfirm}
        onCancel={handleDeadlineCancel}
        display='default'
      />
    </View>
  )
}

export default DonationFields
