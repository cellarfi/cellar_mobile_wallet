import { AddressBookEntry } from '@/types'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface ContactCardProps {
  contact: AddressBookEntry
  onPress: (address: string) => void
}

export default function ContactCard({ contact, onPress }: ContactCardProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(contact.address)}
      className='bg-secondary-light rounded-2xl p-4 mr-3 w-32 items-center'
    >
      <View className='flex bg-primary-900 rounded-full w-10 h-10 items-center justify-center'>
        <Text className='text-xl text-white '>{contact.name.charAt(0)}</Text>
      </View>
      <Text className='text-white font-medium text-sm'>{contact.name}</Text>
      <Text className='text-gray-400 text-xs' numberOfLines={1}>
        {contact.address.slice(0, 8)}...
      </Text>
    </TouchableOpacity>
  )
}
