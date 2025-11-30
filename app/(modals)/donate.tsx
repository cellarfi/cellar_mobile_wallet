import TransactionLoadingModal from '@/components/TransactionLoadingModal'
import TransactionSuccessModal from '@/components/TransactionSuccessModal'
import CustomButton from '@/components/ui/CustomButton'
import { blurHashPlaceholder } from '@/constants/App'
import { useRefetchContext } from '@/contexts/RefreshProvider'
import { usePortfolio } from '@/hooks/usePortfolio'
import { analyticsRequest } from '@/libs/api_requests/analytics.request'
import { PostsRequests } from '@/libs/api_requests/posts.request'
import {
  calculateFee,
  getConnection,
  isValidSolanaAddress,
  USDC_METADATA,
} from '@/libs/solana.lib'
import { SendSplToken } from '@/libs/spl.helpers'
import { useAuthStore } from '@/store/authStore'
import {
  usePostDetailsStore,
  useSocialEventsStore,
} from '@/store/socialEventsStore'
import { Ionicons } from '@expo/vector-icons'
import { formatWalletAddress, useEmbeddedSolanaWallet } from '@privy-io/expo'
import { PublicKey, Transaction } from '@solana/web3.js'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Quick donation amounts
const QUICK_AMOUNTS = [5, 10, 25, 50, 100]

export default function DonateModal() {
  const { portfolio, isLoading: portfolioLoading } = usePortfolio()

  const { refetchPortfolio } = useRefetchContext()
  const { activeWallet } = useAuthStore()
  const { wallets } = useEmbeddedSolanaWallet()
  const triggerRefresh = useSocialEventsStore((state) => state.triggerRefresh)
  const triggerPostDetailsRefresh = usePostDetailsStore(
    (state) => state.triggerRefresh
  )

  // Route parameters
  const { postId, walletAddress, campaignTitle, currentAmount, targetAmount } =
    useLocalSearchParams<{
      postId?: string
      walletAddress?: string
      campaignTitle?: string
      currentAmount?: string
      targetAmount?: string
    }>()

  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [step, setStep] = useState<'input' | 'confirm'>('input')
  const [transactionFee, setTransactionFee] = useState<number | null>(null)
  const [calculatingFee, setCalculatingFee] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Modal states
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [txSignature, setTxSignature] = useState<string>('')

  // Get USDC token from portfolio
  const usdcToken = useMemo(() => {
    if (!portfolio?.items) return null
    return portfolio.items.find(
      (token) => token.address === USDC_METADATA.address
    )
  }, [portfolio])

  // Calculate USDC balance
  const formatBalance = (balance: number, decimals: number = 6) => {
    return balance / Math.pow(10, decimals)
  }

  const getUsdcBalance = () => {
    if (!usdcToken) return 0
    return formatBalance(usdcToken.balance, usdcToken.decimals)
  }

  const usdcBalance = getUsdcBalance()
  const numAmount = parseFloat(amount) || 0
  const isInsufficientFunds = numAmount > usdcBalance

  // Validate wallet address
  const isValidAddress = walletAddress
    ? isValidSolanaAddress(walletAddress)
    : false

  // Handle quick amount selection
  const handleQuickAmount = (quickAmount: number) => {
    if (quickAmount > usdcBalance) {
      Alert.alert(
        'Insufficient Balance',
        `You only have ${usdcBalance.toFixed(2)} USDC available`
      )
      return
    }
    setAmount(quickAmount.toString())
  }

  // Build USDC transaction
  const buildTransaction = async (
    recipientAddress: string,
    amount: number,
    walletAddress: string
  ): Promise<Transaction> => {
    if (!walletAddress) {
      throw new Error('Wallet address is required')
    }
    if (!recipientAddress) {
      throw new Error('Recipient address is required')
    }
    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required')
    }

    const fromPubkey = new PublicKey(walletAddress)
    const toPubkey = new PublicKey(recipientAddress)
    const mintAddress = new PublicKey(USDC_METADATA.address)

    return await SendSplToken(getConnection(), {
      amount,
      fromPubKey: fromPubkey,
      toPubKey: toPubkey,
      mintAddress,
    })
  }

  // Calculate transaction fee
  const calculateTransactionFee = async () => {
    if (!walletAddress || !amount || !activeWallet) return

    try {
      setCalculatingFee(true)
      setTransactionFee(null)

      const transaction = await buildTransaction(
        walletAddress,
        numAmount,
        activeWallet.address
      )

      const fee = await calculateFee(getConnection(), transaction)
      setTransactionFee(fee / 1e9) // Convert from lamports to SOL
    } catch (error: any) {
      console.error('Error calculating fee:', error)
      setTransactionFee(0.000005) // Fallback to default fee
    } finally {
      setCalculatingFee(false)
    }
  }

  const handleDonate = async () => {
    if (!walletAddress || !amount) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    if (!isValidAddress) {
      Alert.alert('Error', 'Invalid recipient wallet address')
      return
    }

    if (isInsufficientFunds) {
      Alert.alert('Error', 'Insufficient USDC balance')
      return
    }

    if (!usdcToken) {
      Alert.alert('Error', 'USDC not found in your portfolio')
      return
    }

    setStep('confirm')
    await calculateTransactionFee()
  }

  const handleConfirmDonate = async () => {
    if (!walletAddress || !amount || !activeWallet || !usdcToken) {
      Alert.alert('Error', 'Missing required transaction data')
      return
    }

    if (!wallets || wallets.length === 0) {
      Alert.alert('Error', 'No wallet available for signing transactions')
      return
    }

    try {
      setIsSending(true)
      setShowLoadingModal(true)

      const provider = await wallets?.[0]?.getProvider()
      if (!provider) {
        throw new Error('No wallet provider available')
      }

      const transaction = await buildTransaction(
        walletAddress,
        numAmount,
        activeWallet.address
      )

      const result = await provider.request({
        method: 'signAndSendTransaction',
        params: {
          transaction,
          connection: getConnection(),
        },
      })

      setTxSignature(result.signature)

      // Create donation record
      // await createDonationRecord()

      // Update funding amount on the post
      if (postId) {
        try {
          const updateResponse = await PostsRequests.incrementFundingAmount(
            postId,
            numAmount
          )
          if (updateResponse.success) {
            // Trigger refresh of social feed to update post stats
            triggerRefresh()
            // Also trigger refresh for post details if viewing a specific post
            triggerPostDetailsRefresh()
          }
        } catch (error) {
          console.error('Error updating funding amount:', error)
          // Don't fail the transaction if this fails, but log it
        }
      }

      // Create transaction analytics
      await analyticsRequest.createTransaction({
        amount: amount,
        type: 'DONATION',
        token_address: USDC_METADATA.address,
        token_name: 'USD Coin',
        tx_hash: result.signature,
      })

      setShowLoadingModal(false)
      setShowSuccessModal(true)

      // Trigger background portfolio refresh
      refetchPortfolio()
    } catch (error: any) {
      console.error('Error sending donation:', error)
      setShowLoadingModal(false)
      Alert.alert(
        'Transaction Failed',
        error?.message || 'Failed to send donation. Please try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleCloseSuccess = () => {
    setShowSuccessModal(false)
    router.back()
  }

  // Loading state
  if (portfolioLoading && !portfolio) {
    return (
      <SafeAreaView className='flex-1 bg-primary-main justify-center items-center'>
        <ActivityIndicator size='large' color='#6366f1' />
        <Text className='text-white mt-4'>Loading portfolio...</Text>
      </SafeAreaView>
    )
  }

  // No USDC available
  if (!usdcToken || usdcBalance === 0) {
    return (
      <SafeAreaView className='flex-1 bg-primary-main'>
        <View className='flex-1'>
          <View className='flex-row items-center justify-between px-6 py-4'>
            <TouchableOpacity
              onPress={() => router.back()}
              className='w-10 h-10 rounded-full justify-center items-center'
            >
              <Ionicons name='chevron-back' size={20} color='white' />
            </TouchableOpacity>
            <Text className='text-white text-lg font-semibold'>Donate</Text>
            <View className='w-10' />
          </View>

          <View className='flex-1 justify-center items-center px-6'>
            <View className='w-20 h-20 bg-blue-500/20 rounded-full justify-center items-center mb-4'>
              <Ionicons name='heart-outline' size={40} color='#3b82f6' />
            </View>
            <Text className='text-white text-xl font-semibold mt-4 text-center'>
              No USDC Available
            </Text>
            <Text className='text-gray-400 text-center mt-2 mb-6'>
              You need USDC to make donations. Please add USDC to your wallet
              first.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // Confirm step
  if (step === 'confirm') {
    return (
      <>
        <SafeAreaView className='flex-1 bg-primary-main'>
          <View className='flex-1'>
            <View className='flex-row items-center justify-between px-6 py-4'>
              <TouchableOpacity
                onPress={() => setStep('input')}
                className='w-10 h-10 rounded-full justify-center items-center'
              >
                <Ionicons name='chevron-back' size={20} color='white' />
              </TouchableOpacity>
              <Text className='text-white text-lg font-semibold'>
                Confirm Donation
              </Text>
              <View className='w-10' />
            </View>

            <ScrollView className='flex-1 px-6'>
              {/* Donation Summary */}
              <View className='bg-secondary-light rounded-3xl p-6 mb-6'>
                <View className='items-center mb-6'>
                  <View className='w-20 h-20 bg-blue-500/20 rounded-full justify-center items-center mb-4 overflow-hidden'>
                    {usdcToken.logoURI ? (
                      <Image
                        source={{ uri: usdcToken.logoURI }}
                        style={{ width: 80, height: 80, borderRadius: 40 }}
                        placeholder={{ blurhash: blurHashPlaceholder }}
                      />
                    ) : (
                      <Ionicons name='heart' size={40} color='#3b82f6' />
                    )}
                  </View>
                  <Text className='text-white text-3xl font-bold'>
                    {numAmount.toFixed(2)} USDC
                  </Text>
                  <Text className='text-gray-400 text-lg mt-1'>
                    ≈ ${numAmount.toFixed(2)}
                  </Text>
                </View>

                <View className='gap-4'>
                  <View className='flex-row justify-between'>
                    <Text className='text-gray-400'>To:</Text>
                    <Text className='text-white font-mono text-sm'>
                      {formatWalletAddress(walletAddress || '')}
                    </Text>
                  </View>
                  <View className='flex-row justify-between'>
                    <Text className='text-gray-400'>Network Fee</Text>
                    <View className='flex-row items-center'>
                      {calculatingFee ? (
                        <ActivityIndicator size={14} color='#6366f1' />
                      ) : (
                        <Text className='text-white'>
                          ~{transactionFee?.toFixed(6) || '0.000005'} SOL
                        </Text>
                      )}
                    </View>
                  </View>
                  {memo && (
                    <View className='flex-row justify-between'>
                      <Text className='text-gray-400'>Message</Text>
                      <Text className='text-white'>{memo}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Campaign Info */}
              {campaignTitle && (
                <View className='bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6'>
                  <View className='flex-row items-start'>
                    <Ionicons
                      name='information-circle'
                      size={20}
                      color='#3b82f6'
                    />
                    <View className='flex-1 ml-3'>
                      <Text className='text-blue-400 font-medium mb-1'>
                        Donation Campaign
                      </Text>
                      <Text className='text-white text-sm mb-1'>
                        {campaignTitle}
                      </Text>
                      {targetAmount && currentAmount && (
                        <Text className='text-gray-400 text-xs mt-1'>
                          Progress: ${parseFloat(currentAmount).toFixed(2)} / $
                          {parseFloat(targetAmount).toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Warning */}
              <View className='bg-warning-500/10 border border-warning-500/20 rounded-2xl p-4 mb-6'>
                <View className='flex-row items-start'>
                  <Ionicons name='warning' size={20} color='#f59e0b' />
                  <View className='flex-1 ml-3'>
                    <Text className='text-warning-400 font-medium mb-1'>
                      Double-check recipient
                    </Text>
                    <Text className='text-sm text-gray-400'>
                      Donations are irreversible. Make sure you&apos;re sending
                      to the correct campaign wallet.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Confirm Button */}
              <CustomButton
                text={isSending ? 'Processing...' : 'Confirm & Donate'}
                onPress={handleConfirmDonate}
                disabled={isSending}
                type='primary'
                shallowGradient
              />
            </ScrollView>
          </View>
        </SafeAreaView>

        {/* Modals */}
        <TransactionLoadingModal
          visible={showLoadingModal}
          label='Processing your donation...'
        />

        <TransactionSuccessModal
          visible={showSuccessModal}
          txSignature={txSignature}
          onClose={handleCloseSuccess}
        />
      </>
    )
  }

  // Input step
  return (
    <SafeAreaView className='flex-1 bg-primary-main'>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className='flex-row items-center justify-between px-6 py-4'>
          <TouchableOpacity
            onPress={() => router.back()}
            className='w-10 h-10 rounded-full justify-center items-center'
          >
            <Ionicons name='chevron-back' size={20} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-lg font-semibold'>Donate</Text>
          <View className='w-10' />
        </View>

        <ScrollView
          className='flex-1 px-6'
          showsVerticalScrollIndicator={false}
        >
          {/* Campaign Info Card */}
          {campaignTitle && (
            <View className='bg-secondary-light rounded-2xl p-4 mb-6 border border-blue-500/20'>
              <View className='flex-row items-center mb-2'>
                <View className='w-10 h-10 bg-blue-500/20 rounded-full justify-center items-center mr-3'>
                  <Ionicons name='heart' size={20} color='#3b82f6' />
                </View>
                <View className='flex-1'>
                  <Text className='text-white font-bold text-base'>
                    {campaignTitle}
                  </Text>
                  {targetAmount && currentAmount && (
                    <Text className='text-gray-400 text-xs mt-1'>
                      ${parseFloat(currentAmount).toFixed(2)} / $
                      {parseFloat(targetAmount).toFixed(2)} raised
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* USDC Balance */}
          <View className='bg-secondary-light rounded-2xl p-4 mb-6'>
            <View className='flex-row items-center justify-between'>
              <View className='flex-row items-center'>
                {usdcToken.logoURI ? (
                  <Image
                    source={{ uri: usdcToken.logoURI }}
                    style={{ width: 32, height: 32, borderRadius: 16 }}
                    placeholder={{ blurhash: blurHashPlaceholder }}
                  />
                ) : (
                  <View className='w-8 h-8 bg-blue-500/20 rounded-full justify-center items-center mr-2'>
                    <Text className='text-blue-400 font-bold text-xs'>
                      USDC
                    </Text>
                  </View>
                )}
                <Text className='text-white font-medium ml-2'>
                  USDC Balance
                </Text>
              </View>
              <Text className='text-white font-bold text-lg'>
                {usdcBalance.toFixed(2)} USDC
              </Text>
            </View>
          </View>

          {/* Amount Input */}
          <View className='mb-6'>
            <Text className='text-white font-medium mb-2'>Donation Amount</Text>
            <View className='bg-secondary-light rounded-2xl px-4 py-4 flex-row items-center'>
              <TextInput
                className='flex-1 text-white text-2xl font-bold'
                placeholder='0.00'
                placeholderTextColor='#666672'
                value={amount}
                onChangeText={setAmount}
                keyboardType='decimal-pad'
              />
              <Text className='text-gray-400 text-lg ml-2'>USDC</Text>
            </View>
            {isInsufficientFunds && (
              <Text className='text-red-400 text-sm mt-1'>
                Insufficient balance
              </Text>
            )}
          </View>

          {/* Quick Amount Buttons */}
          <View className='mb-6'>
            <Text className='text-gray-400 text-sm mb-3'>Quick Amounts</Text>
            <View className='flex-row flex-wrap gap-3'>
              {QUICK_AMOUNTS.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  onPress={() => handleQuickAmount(quickAmount)}
                  className={`px-4 py-2 rounded-xl border ${
                    amount === quickAmount.toString()
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-secondary-light border-zinc-700'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      amount === quickAmount.toString()
                        ? 'text-white'
                        : 'text-gray-300'
                    }`}
                  >
                    ${quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => {
                  setAmount(usdcBalance.toFixed(2))
                }}
                className={`px-4 py-2 rounded-xl border ${
                  amount === usdcBalance.toFixed(2)
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-secondary-light border-zinc-700'
                }`}
              >
                <Text
                  className={`font-medium ${
                    amount === usdcBalance.toFixed(2)
                      ? 'text-white'
                      : 'text-gray-300'
                  }`}
                >
                  Max
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Message (Optional) */}
          <View className='mb-8'>
            <Text className='text-white font-medium mb-2'>
              Message (Optional)
            </Text>
            <View className='bg-secondary-light rounded-2xl px-4 py-4'>
              <TextInput
                className='text-white text-lg'
                placeholder='Add a message...'
                placeholderTextColor='#666672'
                value={memo}
                onChangeText={setMemo}
                multiline
                maxLength={100}
              />
            </View>
          </View>

          {/* Donate Button */}
          <CustomButton
            text='Review Donation'
            onPress={handleDonate}
            shallowGradient
            disabled={
              !amount ||
              !walletAddress ||
              !isValidAddress ||
              isInsufficientFunds ||
              numAmount <= 0
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
