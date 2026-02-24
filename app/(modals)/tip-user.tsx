import SendTokenSelector from '@/components/SendTokenSelector'
import TransactionLoadingModal from '@/components/TransactionLoadingModal'
import TransactionSuccessModal from '@/components/TransactionSuccessModal'
import CustomButton from '@/components/ui/CustomButton'
import { blurHashPlaceholder } from '@/constants/App'
import { ENV } from '@/constants/Env'
import { useRefetchContext } from '@/contexts/RefreshProvider'
import { usePortfolio } from '@/hooks/usePortfolio'
import { analyticsRequest } from '@/libs/api_requests/analytics.request'
import {
  calculateFee,
  getConnection,
  NATIVE_SOL_MINT,
  sendNativeSol,
  USDC_METADATA,
  WRAPPED_SOL_MINT,
} from '@/libs/solana.lib'
import { SendSplToken } from '@/libs/spl.helpers'
import { useAuthStore } from '@/store/authStore'
import { BirdEyeTokenItem } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from '@solana/web3.js'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
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

export default function TipUserModal() {
  const { recipientStart, recipientName, recipientImage, recipientTagName } =
    useLocalSearchParams<{
      recipientStart?: string
      recipientName?: string
      recipientImage?: string
      recipientTagName?: string
    }>()

  const { portfolio, isLoading: portfolioLoading } = usePortfolio()
  const { refetchPortfolio } = useRefetchContext()
  const { activeWallet } = useAuthStore()
  const { wallets } = useEmbeddedSolanaWallet()

  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('Tip from Cellar')
  const [selectedToken, setSelectedToken] = useState<BirdEyeTokenItem | null>(
    null
  )

  // UI State
  const [isUsdMode, setIsUsdMode] = useState(false) // Default to Token mode
  const [step, setStep] = useState<'input' | 'confirm'>('input')
  const [isSending, setIsSending] = useState(false)
  const [calculatingFee, setCalculatingFee] = useState(false)
  const [transactionFee, setTransactionFee] = useState<number | null>(null)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [txSignature, setTxSignature] = useState<string>('')

  // Get available tokens
  const availableTokens = useMemo(() => {
    if (!portfolio?.items) return []
    return portfolio.items.filter((item) => item.balance > 0)
  }, [portfolio])

  // 1. Initial Token Selection Logic
  // Default: USDC -> SOL -> First Token
  useEffect(() => {
    // Only set default if no token is selected
    if (selectedToken) return

    if (portfolio?.items) {
      const usdc = portfolio.items.find(
        (t) => t.address === USDC_METADATA.address
      )
      if (usdc) {
        setSelectedToken(usdc)
        return
      }

      const sol = portfolio.items.find(
        (t) => t.address === NATIVE_SOL_MINT || t.address === WRAPPED_SOL_MINT
      )
      if (sol) {
        setSelectedToken(sol)
        return
      }

      if (portfolio.items.length > 0) {
        setSelectedToken(portfolio.items[0])
      }
    }
  }, [portfolio, selectedToken])

  // Helper: Formatters
  const formatBalance = (balance: number, decimals: number) => {
    return balance / Math.pow(10, decimals)
  }

  // Derived Values
  const getValues = () => {
    if (!amount || !selectedToken) return { tokenAmount: 0, usdAmount: 0 }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount)) return { tokenAmount: 0, usdAmount: 0 }

    if (isUsdMode) {
      // Input is USD, calculate Token Amount
      // Token = USD / Price
      if (!selectedToken.priceUsd)
        return { tokenAmount: 0, usdAmount: numAmount }
      return {
        tokenAmount: numAmount / selectedToken.priceUsd,
        usdAmount: numAmount,
      }
    } else {
      // Input is Token, calculate USD
      // USD = Token * Price
      return {
        tokenAmount: numAmount,
        usdAmount: numAmount * (selectedToken.priceUsd || 0),
      }
    }
  }

  const { tokenAmount, usdAmount } = getValues()

  const tokenBalance = selectedToken
    ? formatBalance(selectedToken.balance, selectedToken.decimals)
    : 0

  const isInsufficientFunds = tokenAmount > tokenBalance

  const isSOLToken = (token: BirdEyeTokenItem) => {
    return token.address === NATIVE_SOL_MINT
  }

  const handleToggleMode = () => {
    if (!amount || !selectedToken || !selectedToken.priceUsd) {
      setIsUsdMode(!isUsdMode)
      return
    }

    const currentVal = parseFloat(amount)
    if (isNaN(currentVal)) {
      setIsUsdMode(!isUsdMode)
      return
    }

    if (isUsdMode) {
      // Switching from USD to Token
      // New Value = USD / Price
      const newTokenAmount = currentVal / selectedToken.priceUsd
      setAmount(newTokenAmount.toFixed(6))
    } else {
      // Switching from Token to USD
      // New Value = Token * Price
      const newUsdAmount = currentVal * selectedToken.priceUsd
      setAmount(newUsdAmount.toFixed(2))
    }
    setIsUsdMode(!isUsdMode)
  }

  // Transaction Builders
  const buildTransaction = async (
    token: BirdEyeTokenItem,
    toAddress: string,
    sendAmount: number,
    fromAddress: string
  ): Promise<Transaction> => {
    if (!fromAddress || !toAddress || sendAmount <= 0)
      throw new Error('Invalid params')

    const fromPubkey = new PublicKey(fromAddress)
    const toPubkey = new PublicKey(toAddress)

    if (isSOLToken(token)) {
      const lamports = Math.floor(sendAmount * LAMPORTS_PER_SOL)
      return await sendNativeSol(new Connection(ENV.RPC_URL), {
        amount: lamports,
        fromPubkey,
        toPubkey,
      })
    } else {
      return await SendSplToken(getConnection(), {
        amount: sendAmount,
        fromPubKey: fromPubkey,
        toPubKey: toPubkey,
        mintAddress: new PublicKey(token.address),
      })
    }
  }

  const calculateTransactionFee = async () => {
    if (!selectedToken || !recipientStart || !tokenAmount || !activeWallet)
      return

    try {
      setCalculatingFee(true)
      const transaction = await buildTransaction(
        selectedToken,
        recipientStart,
        tokenAmount,
        activeWallet.address
      )
      const fee = await calculateFee(getConnection(), transaction)
      setTransactionFee(fee / LAMPORTS_PER_SOL)
    } catch (e) {
      console.error('Fee Calc Error:', e)
      setTransactionFee(0.000005)
    } finally {
      setCalculatingFee(false)
    }
  }

  const handleReview = async () => {
    if (!recipientStart) {
      Alert.alert('Error', 'Recipient address missing')
      return
    }
    if (isInsufficientFunds) {
      Alert.alert('Error', 'Insufficient balance')
      return
    }
    setStep('confirm')
    calculateTransactionFee()
  }

  const handleConfirm = async () => {
    if (!activeWallet || !selectedToken || !recipientStart) return

    try {
      setIsSending(true)
      setShowLoadingModal(true)

      const provider = await wallets?.[0]?.getProvider()
      if (!provider) throw new Error('No wallet provider')

      const transaction = await buildTransaction(
        selectedToken,
        recipientStart,
        tokenAmount,
        activeWallet.address
      )

      const result = await provider.request({
        method: 'signAndSendTransaction',
        params: { transaction, connection: getConnection() },
      })

      setTxSignature(result.signature)

      // Log Analytics
      await analyticsRequest.createTransaction({
        amount: amount,
        type: 'DONATION', // Using DONATION for tips
        token_address: selectedToken.address,
        token_name: selectedToken.name || '',
        tx_hash: result.signature,
      })

      setShowSuccessModal(true)
      refetchPortfolio()
    } catch (error: any) {
      console.error(error)
      Alert.alert(
        'Failed',
        error.message || 'Transaction could not be completed'
      )
    } finally {
      setIsSending(false)
      setShowLoadingModal(false)
    }
  }

  // --- UI Renders ---

  if (portfolioLoading && !portfolio) {
    return (
      <SafeAreaView className='flex-1 bg-primary-main justify-center items-center'>
        <ActivityIndicator color='#6366f1' size='large' />
      </SafeAreaView>
    )
  }

  if (!recipientStart) {
    return (
      <SafeAreaView className='flex-1 bg-primary-main justify-center items-center px-6'>
        <Text className='text-white text-lg text-center'>
          Recipient information is missing. Please go back and try again.
        </Text>
        <CustomButton
          text='Go Back'
          onPress={() => router.back()}
          className='mt-4'
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-primary-main'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className='flex-row items-center justify-between px-6 py-4'>
          <TouchableOpacity
            onPress={() =>
              step === 'confirm' ? setStep('input') : router.back()
            }
            className='w-10 h-10 rounded-full justify-center items-center bg-secondary-light'
          >
            <Ionicons name='chevron-back' size={24} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-lg font-bold'>
            {step === 'confirm' ? 'Confirm Tip' : 'Send Tip'}
          </Text>
          <View className='w-10' />
        </View>

        <ScrollView
          className='flex-1 px-6'
          showsVerticalScrollIndicator={false}
        >
          {/* Recipient Info */}
          <View className='items-center mb-8 mt-2'>
            <Image
              source={recipientImage ? { uri: recipientImage } : undefined}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#333',
              }}
              placeholder={{ blurhash: blurHashPlaceholder }}
              contentFit='cover'
            />
            <Text className='text-white text-xl font-bold mt-3'>
              {recipientName || 'Unknown User'}
            </Text>
            {recipientTagName && (
              <Text className='text-gray-400 text-sm'>@{recipientTagName}</Text>
            )}
          </View>

          {step === 'input' ? (
            <>
              {/* Token Selector */}
              <SendTokenSelector
                selectedToken={selectedToken}
                tokens={availableTokens}
                onTokenSelect={(token) => {
                  setSelectedToken(token)
                  setAmount('') // Reset amount on token change
                }}
              />

              {/* Amount Input */}
              <View className='bg-secondary-light rounded-3xl p-6 mb-4'>
                <View className='flex-row justify-between items-center mb-2'>
                  <Text className='text-gray-400 font-medium'>Amount</Text>
                  <View className='flex-row items-center gap-3'>
                    <TouchableOpacity
                      onPress={() => setAmount(tokenBalance.toString())}
                    >
                      <Text className='text-secondary font-medium'>Max</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleToggleMode}
                      className='bg-secondary-light rounded-2xl flex-row items-center overflow-hidden'
                    >
                      <View
                        className={`px-4 py-2 ${!isUsdMode ? 'bg-primary-500' : 'bg-transparent'}`}
                      >
                        <Text
                          className={`text-sm ${!isUsdMode ? 'text-white font-medium' : 'text-gray-400'}`}
                        >
                          {selectedToken?.symbol || 'TOKEN'}
                        </Text>
                      </View>
                      <View
                        className={`px-4 py-2 ${isUsdMode ? 'bg-primary-500' : 'bg-transparent'}`}
                      >
                        <Text
                          className={`text-sm ${isUsdMode ? 'text-white font-medium' : 'text-gray-400'}`}
                        >
                          USD
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className='flex-row items-center'>
                  {isUsdMode && (
                    <Text className='text-white text-3xl font-bold mr-1'>
                      $
                    </Text>
                  )}
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType='decimal-pad'
                    placeholder='0.00'
                    placeholderTextColor='#555'
                    className='flex-1 text-white text-4xl font-bold py-2'
                    autoFocus
                  />
                </View>

                <Text className='text-gray-400 text-sm mt-2'>
                  {isUsdMode
                    ? `≈ ${tokenAmount.toFixed(6)} ${selectedToken?.symbol || ''}`
                    : `≈ $${usdAmount.toFixed(2)}`}
                </Text>

                {isInsufficientFunds && (
                  <Text className='text-red-500 text-sm mt-2 font-medium'>
                    Insufficient Balance
                  </Text>
                )}
              </View>

              {/* Quick Amounts */}
              <View className='flex-row gap-3 mb-6'>
                {[1, 5, 10].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => {
                      setAmount(val.toString())
                      setIsUsdMode(true)
                    }}
                    className='bg-secondary-light px-4 py-2 rounded-xl flex-1 items-center'
                  >
                    <Text className='text-white font-bold'>${val}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <CustomButton
                text='Review Tip'
                onPress={handleReview}
                disabled={
                  !amount || parseFloat(amount) <= 0 || isInsufficientFunds
                }
                className='mt-4'
                shallowGradient
              />
            </>
          ) : (
            <>
              {/* Confirmation View */}
              <View className='bg-secondary-light rounded-3xl p-6 mb-6'>
                <Text className='text-gray-400 text-center mb-2'>
                  You are sending
                </Text>
                <Text className='text-white text-4xl font-bold text-center mb-2'>
                  {tokenAmount.toFixed(4)} {selectedToken?.symbol}
                </Text>
                <Text className='text-gray-400 text-center mb-6'>
                  ≈ ${usdAmount.toFixed(2)}
                </Text>

                <View className='h-[1px] bg-dark-300 mb-6' />

                <View className='flex-row justify-between mb-4'>
                  <Text className='text-gray-400'>To</Text>
                  <Text className='text-white font-medium'>
                    {recipientName}
                  </Text>
                </View>

                <View className='flex-row justify-between mb-4'>
                  <Text className='text-gray-400'>Network Fee</Text>
                  <Text className='text-white font-medium'>
                    {transactionFee
                      ? `~${transactionFee.toFixed(6)} SOL`
                      : 'Calculating...'}
                  </Text>
                </View>
              </View>

              <CustomButton
                text={isSending ? 'Sending Tip...' : 'Send Tip'}
                onPress={handleConfirm}
                disabled={isSending || calculatingFee}
                shallowGradient
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <TransactionLoadingModal
        visible={showLoadingModal}
        label='Sending your tip...'
      />

      <TransactionSuccessModal
        visible={showSuccessModal}
        txSignature={txSignature}
        onClose={() => {
          setShowSuccessModal(false)
          router.dismissAll()
        }}
      />
    </SafeAreaView>
  )
}
