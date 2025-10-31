import TransactionLoadingModal from '@/components/TransactionLoadingModal'
import TransactionSuccessModal from '@/components/TransactionSuccessModal'
import CustomButton from '@/components/ui/CustomButton'
import { blurHashPlaceholder } from '@/constants/App'
import { useRefetchContext } from '@/contexts/RefreshProvider'
import { usePortfolio } from '@/hooks/usePortfolio'
import { usePrivySign } from '@/hooks/usePrivySign'
import { useTrending } from '@/hooks/useTrending'
import { jupiterRequests } from '@/libs/api_requests/jupiter.request'
import { NATIVE_SOL_MINT, WRAPPED_SOL_MINT } from '@/libs/solana.lib'
import { getSplTokenAddress } from '@/libs/spl.helpers'
import { formatNumber } from '@/libs/string.helpers'
import { useAuthStore } from '@/store/authStore'
import {
  BirdEyeSearchTokenResult,
  BirdEyeTokenItem,
  JupiterQuoteOrderResponse,
} from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { VersionedTransaction } from '@solana/web3.js'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Token Selector Component - moved outside to prevent re-renders and focus loss
const TokenSelectorCard = React.memo(
  ({
    token,
    amount,
    usdValue,
    onPress,
    onAmountChange,
    onFocus,
    placeholder,
    isInput = true,
    formatBalance,
  }: {
    token: BirdEyeTokenItem | BirdEyeSearchTokenResult | null
    amount: string
    usdValue: number
    onPress: () => void
    onAmountChange: (value: string) => void
    onFocus: () => void
    placeholder: string
    isInput?: boolean
    formatBalance: (balance: number, decimals?: number) => string
  }) => (
    <View className='bg-secondary-light rounded-2xl p-4'>
      <View className='flex-row items-center justify-between mb-3'>
        <Text className='text-gray-400 text-sm'>
          {isInput ? 'You Pay' : 'You Receive'}
        </Text>
        {isInput && token && 'balance' in token && (
          <Text className='text-gray-400 text-sm'>
            Balance: {formatBalance(token.balance, token.decimals)}
          </Text>
        )}
      </View>

      <View className='flex-row items-center justify-between'>
        <View className='flex-1 mr-4'>
          <TextInput
            className='text-white text-2xl font-bold'
            placeholder='0.0'
            placeholderTextColor='#666672'
            value={amount}
            onChangeText={onAmountChange}
            onFocus={onFocus}
            keyboardType='numeric'
          />
          <Text className='text-gray-400 text-sm mt-1'>
            ~${usdValue.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          className='flex-row items-center bg-primary-500/15 rounded-xl p-3'
          onPress={onPress}
        >
          {token ? (
            <>
              <View className='w-8 h-8 bg-primary-500/20 rounded-full justify-center items-center mr-2 overflow-hidden'>
                {('logoURI' in token && token.logoURI) ||
                ('logo_uri' in token && token.logo_uri) ? (
                  <Image
                    source={{
                      uri:
                        ('logoURI' in token && token.logoURI) ||
                        ('logo_uri' in token && token.logo_uri) ||
                        '',
                    }}
                    style={{ width: 32, height: 32, borderRadius: 16 }}
                    placeholder={{ blurhash: blurHashPlaceholder }}
                  />
                ) : (
                  <Text className='text-sm font-bold text-primary-400'>
                    {token.symbol?.charAt(0) || '?'}
                  </Text>
                )}
              </View>
              <View className='mr-2'>
                <Text className='text-white font-semibold'>{token.symbol}</Text>
              </View>
              <Ionicons name='chevron-down' size={16} color='#666672' />
            </>
          ) : (
            <>
              <Text className='text-gray-400 mr-2'>{placeholder}</Text>
              <Ionicons name='chevron-down' size={16} color='#666672' />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
)

export default function SwapScreen() {
  const { portfolio } = usePortfolio()
  const { refetchPortfolio } = useRefetchContext()
  const { activeWallet } = useAuthStore()
  const { signTransaction } = usePrivySign()
  const { trending } = useTrending()

  // Get route parameters for token preselection
  const {
    inputToken: inputTokenParam,
    outputToken: outputTokenParam,
    selectedOutputToken: selectedOutputTokenParam,
  } = useLocalSearchParams<{
    inputToken?: string
    outputToken?: string
    selectedOutputToken?: string
  }>()

  // Token states
  const [inputToken, setInputToken] = useState<BirdEyeTokenItem | null>(null)
  const [outputToken, setOutputToken] =
    useState<BirdEyeSearchTokenResult | null>(null)

  // Amount states
  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount, setOutputAmount] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(true)

  // Modal states
  const [showInputTokenModal, setShowInputTokenModal] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [txSignature, setTxSignature] = useState<string>('')

  // Search states (only for input tokens)
  const [inputSearchQuery, setInputSearchQuery] = useState('')

  // Jupiter states
  const [jupiterQuote, setJupiterQuote] =
    useState<JupiterQuoteOrderResponse | null>(null)
  const [isGettingQuote, setIsGettingQuote] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  // Percentage button states
  const [activePercentageButton, setActivePercentageButton] = useState<
    string | null
  >(null)

  // Error states
  const [insufficientBalance, setInsufficientBalance] = useState(false)

  // Handle preselected input token from token detail page
  useEffect(() => {
    if (inputTokenParam && inputTokenParam !== 'undefined') {
      try {
        const parsedToken: BirdEyeTokenItem = JSON.parse(inputTokenParam)
        console.log('Preselecting input token:', parsedToken)
        setInputToken(parsedToken)
        // Clear the parameter to avoid re-triggering
        router.setParams({ inputToken: undefined })
      } catch (error) {
        console.error('Failed to parse inputToken parameter:', error)
      }
    }
  }, [inputTokenParam])

  // Handle preselected output token from token detail page
  useEffect(() => {
    if (outputTokenParam && outputTokenParam !== 'undefined') {
      try {
        const parsedToken: BirdEyeSearchTokenResult =
          JSON.parse(outputTokenParam)
        console.log('Preselecting output token:', parsedToken)
        setOutputToken(parsedToken)
        // Clear the parameter to avoid re-triggering
        router.setParams({ outputToken: undefined })
      } catch (error) {
        console.error('Failed to parse outputToken parameter:', error)
      }
    }
  }, [outputTokenParam])

  // Handle selected output token from search modal
  useEffect(() => {
    if (selectedOutputTokenParam && selectedOutputTokenParam !== 'undefined') {
      try {
        const parsedToken: BirdEyeSearchTokenResult = JSON.parse(
          selectedOutputTokenParam
        )
        console.log('Selected output token from search:', parsedToken)
        setOutputToken(parsedToken)
        // Clear the parameter to avoid re-triggering
        router.setParams({ selectedOutputToken: undefined })
      } catch (error) {
        console.error('Failed to parse selectedOutputToken parameter:', error)
      }
    }
  }, [selectedOutputTokenParam])

  // Get available tokens from portfolio
  const availableTokens = useMemo(() => {
    if (!portfolio?.items) return []
    return portfolio.items.filter((item) => item.balance > 0)
  }, [portfolio])

  // USDC mint address
  const USDC_MINT = getSplTokenAddress('usdc')

  // Select default input token (SOL first, then USDC, then first available) - but only if no token preselected
  useEffect(() => {
    // Don't run default selection if we have a preselected input token parameter
    if (inputTokenParam && inputTokenParam !== 'undefined') {
      return
    }

    if (availableTokens.length > 0 && !inputToken) {
      // First try to find SOL
      const nativeSol = availableTokens.find(
        (token) =>
          token.address === NATIVE_SOL_MINT ||
          token.address === WRAPPED_SOL_MINT
      )

      if (nativeSol) {
        console.log('Setting default input token to SOL:', nativeSol)
        setInputToken(nativeSol)
        return
      }

      // Then try to find USDC
      if (USDC_MINT) {
        const usdc = availableTokens.find(
          (token) => token.address === USDC_MINT
        )

        if (usdc) {
          console.log('Setting default input token to USDC:', usdc)
          setInputToken(usdc)
          return
        }
      }

      // Finally fallback to first available token
      console.log(
        'Setting default input token to first available:',
        availableTokens[0]
      )
      setInputToken(availableTokens[0])
    }
  }, [availableTokens, inputToken, inputTokenParam, USDC_MINT])

  // Filter input tokens based on search
  const filteredInputTokens = useMemo(() => {
    if (!inputSearchQuery.trim()) return availableTokens

    const query = inputSearchQuery.toLowerCase().trim()
    return availableTokens.filter(
      (token) =>
        token.symbol?.toLowerCase().includes(query) ||
        token.name?.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
    )
  }, [availableTokens, inputSearchQuery])

  // Format balance helper
  const formatBalance = useCallback((balance: number, decimals: number = 9) => {
    const actualBalance = balance / Math.pow(10, decimals)
    return actualBalance.toLocaleString('en-US', {
      maximumFractionDigits: 6,
      minimumFractionDigits: 0,
    })
  }, [])

  // Handle percentage button clicks
  const handlePercentageClick = useCallback(
    (percentage: string) => {
      if (!inputToken || !('balance' in inputToken)) return

      const actualBalance =
        inputToken.balance / Math.pow(10, inputToken.decimals)
      let amount = 0

      switch (percentage) {
        case '25%':
          amount = actualBalance * 0.25
          break
        case '50%':
          amount = actualBalance * 0.5
          break
        case 'Max':
          amount = actualBalance
          break
        default:
          return
      }

      setInputAmount(amount.toFixed(6))
      setActivePercentageButton(percentage)
      setIsInputFocused(true)
    },
    [inputToken]
  )

  // Clear active percentage button when amount is manually changed
  const handleInputAmountChange = useCallback((value: string) => {
    setInputAmount(value)
    setActivePercentageButton(null) // Clear active button when manually typing
  }, [])

  // Check for insufficient balance
  const checkInsufficientBalance = useCallback(() => {
    if (!inputToken || !('balance' in inputToken) || !inputAmount) {
      setInsufficientBalance(false)
      return false
    }

    const amount = parseFloat(inputAmount)
    if (isNaN(amount) || amount <= 0) {
      setInsufficientBalance(false)
      return false
    }

    const actualBalance = inputToken.balance / Math.pow(10, inputToken.decimals)
    const isInsufficient = amount > actualBalance
    setInsufficientBalance(isInsufficient)
    return isInsufficient
  }, [inputToken, inputAmount])

  // Calculate USD values
  const getInputUsdValue = useCallback(() => {
    if (!inputToken || !inputAmount) return 0
    const amount = parseFloat(inputAmount)
    if (isNaN(amount) || !inputToken.priceUsd) return 0
    return amount * inputToken.priceUsd
  }, [inputToken, inputAmount])

  const getOutputUsdValue = useCallback(() => {
    if (!outputToken || !outputAmount) return 0
    const amount = parseFloat(outputAmount)
    if (isNaN(amount) || !outputToken.price) return 0
    return amount * outputToken.price
  }, [outputToken, outputAmount])

  // Get Jupiter quote (called manually)
  const getJupiterQuote = useCallback(async () => {
    if (!inputToken || !outputToken || !inputAmount || !activeWallet?.address)
      return

    const amount = parseFloat(inputAmount)
    if (isNaN(amount) || amount <= 0) return

    // Convert amount to base units
    const amountInBaseUnits = Math.floor(
      amount * Math.pow(10, inputToken.decimals)
    )

    setIsGettingQuote(true)
    setJupiterQuote(null)
    setQuoteError(null) // Clear any previous errors

    try {
      const response = await jupiterRequests.getOrder({
        inputMint: inputToken.address,
        outputMint: outputToken.address,
        amount: amountInBaseUnits,
        taker: activeWallet.address,
      })

      if (response.success && response.data) {
        setJupiterQuote(response.data)
        setQuoteError(null)
        // Update output amount based on Jupiter quote for accuracy
        const quotedOutputAmount =
          parseFloat(response.data.outAmount) /
          Math.pow(10, outputToken.decimals || 9)
        setOutputAmount(quotedOutputAmount?.toFixed(6) || '0')
      } else {
        setQuoteError(response.message || 'Failed to get quote from Jupiter')
        setJupiterQuote(null)
      }
    } catch (error: any) {
      console.error('Error getting Jupiter quote:', error)
      setQuoteError(
        error.message || 'Network error occurred. Please try again.'
      )
      setJupiterQuote(null)
    } finally {
      setIsGettingQuote(false)
    }
  }, [inputToken, outputToken, inputAmount, activeWallet])

  // Execute swap
  const executeSwap = useCallback(async () => {
    if (!jupiterQuote) return

    setIsSwapping(true)
    setShowLoadingModal(true)
    try {
      console.log('Creating transaction from Jupiter order:', jupiterQuote)

      // Create transaction from Jupiter order
      const transaction =
        jupiterRequests.createTransactionFromOrder(jupiterQuote)

      console.log('Transaction:', transaction)

      // Sign transaction with Privy
      const signedTransaction = (await signTransaction(
        transaction
      )) as VersionedTransaction

      // Execute the order
      const response = await jupiterRequests.executeOrder(
        jupiterQuote,
        signedTransaction
      )

      if (response.success) {
        // Success - show success modal
        setShowQuoteModal(false)
        setShowLoadingModal(false)
        setShowSuccessModal(true)
        setTxSignature(response.data?.signature || 'Unknown')

        // Trigger background portfolio refresh
        refetchPortfolio()
      } else {
        // Failed - show error and hide loading modal
        setShowLoadingModal(false)
        setQuoteError(response.message || 'Swap failed. Please try again.')
      }
    } catch (error: any) {
      console.error('Error executing swap:', error)
      setShowLoadingModal(false)
      setQuoteError(
        error.message || 'An error occurred during the swap. Please try again.'
      )
    } finally {
      setIsSwapping(false)
    }
  }, [jupiterQuote, signTransaction, refetchPortfolio])

  // Swap input and output tokens
  const swapTokens = useCallback(() => {
    if (!inputToken || !outputToken) return

    // Convert outputToken to inputToken format
    const newInputToken: BirdEyeTokenItem = {
      address: outputToken.address,
      decimals: outputToken.decimals,
      balance: 0,
      uiAmount: 0,
      chainId: 'solana',
      name: outputToken.name,
      symbol: outputToken.symbol,
      logoURI: outputToken.logo_uri,
      priceUsd: outputToken.price,
      valueUsd: 0,
    }

    // Find if we actually have this token in portfolio
    const portfolioToken = availableTokens.find(
      (token) => token.address === outputToken.address
    )
    if (portfolioToken) {
      setInputToken(portfolioToken)
    } else {
      setInputToken(newInputToken)
    }

    // Convert inputToken to outputToken format
    const newOutputToken: BirdEyeSearchTokenResult = {
      name: inputToken.name || '',
      symbol: inputToken.symbol || '',
      address: inputToken.address,
      network: 'solana',
      decimals: inputToken.decimals,
      logo_uri: inputToken.logoURI || '',
      verified: true,
      fdv: 0,
      market_cap: 0,
      liquidity: inputToken.liquidity || 0,
      price: inputToken.priceUsd || 0,
      price_change_24h_percent: inputToken.priceChange24h || 0,
      sell_24h: 0,
      sell_24h_change_percent: 0,
      buy_24h: 0,
      buy_24h_change_percent: 0,
      unique_wallet_24h: 0,
      unique_wallet_24h_change_percent: 0,
      trade_24h: 0,
      trade_24h_change_percent: 0,
      volume_24h_change_percent: 0,
      volume_24h_usd: 0,
      last_trade_unix_time: 0,
      last_trade_human_time: '',
      supply: 0,
      updated_time: 0,
    }
    setOutputToken(newOutputToken)

    // Swap amounts
    const tempAmount = inputAmount
    setInputAmount(outputAmount)
    setOutputAmount(tempAmount)
  }, [inputToken, outputToken, inputAmount, outputAmount, availableTokens])

  // Handle get quote button press
  const handleGetQuote = () => {
    setShowQuoteModal(true)
    getJupiterQuote()
  }

  // Only calculate estimates when manually editing (no automatic Jupiter calls)
  useEffect(() => {
    if (isInputFocused) {
      // Calculate output from input
      if (
        !inputToken ||
        !outputToken ||
        !inputToken.priceUsd ||
        !outputToken.price
      )
        return

      // If input amount is cleared or 0, clear output amount too
      if (!inputAmount || inputAmount === '' || parseFloat(inputAmount) === 0) {
        setOutputAmount('')
        setActivePercentageButton(null) // Clear active button when amount is cleared
        setInsufficientBalance(false) // Clear insufficient balance error
        return
      }

      const inputAmountNum = parseFloat(inputAmount)
      if (isNaN(inputAmountNum)) return

      const inputUsdValue = inputAmountNum * inputToken.priceUsd
      const outputAmountNum = inputUsdValue / outputToken.price
      setOutputAmount(outputAmountNum?.toFixed(6) || '0')
    } else {
      // Calculate input from output
      if (
        !inputToken ||
        !outputToken ||
        !inputToken.priceUsd ||
        !outputToken.price
      )
        return

      // If output amount is cleared or 0, clear input amount too
      if (
        !outputAmount ||
        outputAmount === '' ||
        parseFloat(outputAmount) === 0
      ) {
        setInputAmount('')
        setActivePercentageButton(null) // Clear active button when amount is cleared
        setInsufficientBalance(false) // Clear insufficient balance error
        return
      }

      const outputAmountNum = parseFloat(outputAmount)
      if (isNaN(outputAmountNum)) return

      const outputUsdValue = outputAmountNum * outputToken.price
      const inputAmountNum = outputUsdValue / inputToken.priceUsd
      setInputAmount(inputAmountNum?.toFixed(6) || '0')
    }
  }, [inputToken, inputAmount, outputAmount, isInputFocused])

  // Separate effect to recalculate output amount when output token changes (but preserve input amount)
  useEffect(() => {
    // Only recalculate if we have input amount and both tokens with prices
    if (
      isInputFocused &&
      inputAmount &&
      parseFloat(inputAmount) > 0 &&
      inputToken?.priceUsd &&
      outputToken?.price
    ) {
      const inputAmountNum = parseFloat(inputAmount)
      if (!isNaN(inputAmountNum)) {
        const inputUsdValue = inputAmountNum * inputToken.priceUsd
        const outputAmountNum = inputUsdValue / outputToken.price
        setOutputAmount(outputAmountNum?.toFixed(6) || '0')
      }
    }
  }, [outputToken?.address, outputToken?.price]) // Only depend on output token address and price changes

  // Check if ready for quote
  const isReadyForQuote =
    inputToken &&
    outputToken &&
    inputAmount &&
    parseFloat(inputAmount) > 0 &&
    outputAmount &&
    parseFloat(outputAmount) > 0 &&
    !insufficientBalance

  const InputTokenListItem = ({ token }: { token: BirdEyeTokenItem }) => (
    <TouchableOpacity
      className='flex-row items-center bg-secondary-light rounded-2xl p-4 mb-3'
      onPress={() => {
        setInputToken(token)
        setShowInputTokenModal(false)
        setInputSearchQuery('')
      }}
    >
      <View className='w-12 h-12 bg-primary-500/20 rounded-full justify-center items-center mr-3 overflow-hidden'>
        {token.logoURI ? (
          <Image
            source={{ uri: token.logoURI }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            placeholder={{ blurhash: blurHashPlaceholder }}
          />
        ) : (
          <Text className='text-lg font-bold text-primary-400'>
            {token.symbol?.charAt(0) || '?'}
          </Text>
        )}
      </View>
      <View className='flex-1'>
        <Text className='text-white font-semibold text-lg'>{token.symbol}</Text>
        <Text className='text-gray-400 text-sm'>{token.name}</Text>
        <Text className='text-gray-400 text-sm'>
          {formatBalance(token.balance, token.decimals)} {token.symbol}
        </Text>
      </View>
      <View className='items-end'>
        <Text className='text-white font-semibold'>
          ${token.valueUsd?.toFixed(2) || '0.00'}
        </Text>
        {token.priceUsd && (
          <Text className='text-gray-400 text-xs'>
            ${token.priceUsd?.toFixed(token.priceUsd >= 1 ? 2 : 6) || '0.00'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )

  // Clear active percentage button when input token changes
  useEffect(() => {
    setActivePercentageButton(null)
    setInsufficientBalance(false)
    setQuoteError(null)
  }, [inputToken])

  // Clear quote error when output token changes
  useEffect(() => {
    setQuoteError(null)
  }, [outputToken])

  // Check for insufficient balance when input amount or token changes
  useEffect(() => {
    checkInsufficientBalance()
  }, [checkInsufficientBalance])

  // Handle success modal close
  const handleCloseSuccess = useCallback(() => {
    setShowSuccessModal(false)
    // Reset all states to start fresh
    setInputToken(null)
    setOutputToken(null)
    setInputAmount('')
    setOutputAmount('')
    setJupiterQuote(null)
    setActivePercentageButton(null)
    setInsufficientBalance(false)
    setQuoteError(null)
    setTxSignature('')
    // Navigate back immediately, portfolio refresh continues in background
    router.back()
  }, [])

  return (
    <SafeAreaView className='flex-1 bg-primary-main'>
      <View className='flex-1'>
        {/* Header */}
        <View className='flex-row items-center justify-between px-6 py-4'>
          <TouchableOpacity
            onPress={() => router.back()}
            className='w-10 h-10 rounded-full justify-center items-center'
          >
            <Ionicons name='chevron-back' size={20} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-lg font-semibold'>Swap</Text>
          <View className='w-10' />
        </View>

        <View className='flex-1 px-6'>
          {/* Input Token Selector */}
          <TokenSelectorCard
            token={inputToken}
            amount={inputAmount}
            usdValue={getInputUsdValue()}
            onPress={() => setShowInputTokenModal(true)}
            onAmountChange={handleInputAmountChange}
            onFocus={() => setIsInputFocused(true)}
            placeholder='Select Token'
            isInput={true}
            formatBalance={formatBalance}
          />

          {/* Percentage Buttons */}
          {inputToken && 'balance' in inputToken && (
            <View className='flex-row justify-between mt-3 mb-1'>
              {['25%', '50%', 'Max'].map((percentage) => (
                <TouchableOpacity
                  key={percentage}
                  className={`flex-1 mx-1 py-2 rounded-xl ${
                    activePercentageButton === percentage
                      ? 'bg-primary-500'
                      : 'bg-secondary-light'
                  }`}
                  onPress={() => handlePercentageClick(percentage)}
                >
                  <Text
                    className={`text-center font-medium ${
                      activePercentageButton === percentage
                        ? 'text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    {percentage}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Insufficient Balance Error */}
          {insufficientBalance && (
            <View className='bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 mt-2'>
              <View className='flex-row items-center'>
                <Ionicons name='warning' size={16} color='#ef4444' />
                <Text className='text-danger-400 ml-2 font-medium'>
                  Insufficient balance
                </Text>
              </View>
              <Text className='text-danger-300/80 text-sm mt-1'>
                You don't have enough {inputToken?.symbol} to complete this swap
              </Text>
            </View>
          )}

          {/* Swap Button */}
          <View className='items-center my-4'>
            <TouchableOpacity
              className='w-12 h-12 bg-primary-500 rounded-full justify-center items-center'
              onPress={swapTokens}
              disabled={!inputToken || !outputToken}
            >
              <Ionicons name='swap-vertical' size={24} color='white' />
            </TouchableOpacity>
          </View>

          {/* Output Token Selector */}
          <TokenSelectorCard
            token={outputToken}
            amount={outputAmount}
            usdValue={getOutputUsdValue()}
            onPress={() => {
              router.push({
                pathname: '/(screens)/search',
                params: {
                  mode: 'select',
                  returnTo: 'swap',
                  returnParam: 'selectedOutputToken',
                  title: 'Select Token to Buy',
                },
              })
            }}
            onAmountChange={setOutputAmount}
            onFocus={() => setIsInputFocused(false)}
            placeholder='Select Token'
            isInput={false}
            formatBalance={formatBalance}
          />

          {/* Get Quote Button */}
          <TouchableOpacity
            className={`rounded-2xl p-4 mt-6 ${
              isReadyForQuote ? 'bg-primary-500' : 'bg-secondary-disabled'
            }`}
            onPress={handleGetQuote}
            disabled={!isReadyForQuote}
          >
            <Text className='text-white font-semibold text-center text-lg'>
              {!inputToken || !outputToken
                ? 'Select Tokens'
                : !inputAmount ||
                    !outputAmount ||
                    parseFloat(inputAmount || '0') === 0 ||
                    parseFloat(outputAmount || '0') === 0
                  ? 'Enter Amounts'
                  : insufficientBalance
                    ? 'Insufficient Balance'
                    : 'Get Quote'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Input Token Selection Modal */}
      <Modal
        visible={showInputTokenModal}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <SafeAreaView className='flex-1 bg-primary-main'>
          <View className='flex-row items-center justify-between px-6 py-4'>
            <TouchableOpacity
              onPress={() => setShowInputTokenModal(false)}
              className='w-10 h-10 rounded-full justify-center items-center'
            >
              <Ionicons name='chevron-back' size={20} color='white' />
            </TouchableOpacity>
            <Text className='text-white text-lg font-semibold'>
              Select Token
            </Text>
            <View className='w-10' />
          </View>

          <View className='px-6 mb-4'>
            <View className='bg-secondary-light rounded-2xl px-4 py-3 flex-row items-center'>
              <Ionicons name='search' size={20} color='#666672' />
              <TextInput
                className='flex-1 text-white ml-3 text-lg'
                placeholder='Search your tokens...'
                placeholderTextColor='#666672'
                value={inputSearchQuery}
                onChangeText={setInputSearchQuery}
                autoCapitalize='none'
                autoCorrect={false}
              />
            </View>
          </View>

          <FlatList
            data={filteredInputTokens}
            keyExtractor={(item) => item.address}
            renderItem={({ item }) => <InputTokenListItem token={item} />}
            className='flex-1 px-6'
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>

      {/* Quote Modal */}
      <Modal
        visible={showQuoteModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => {
          setShowQuoteModal(false)
          setQuoteError(null)
        }}
      >
        <SafeAreaView className='flex-1 bg-primary-main'>
          <View className='flex-row items-center justify-between px-6 py-4'>
            <TouchableOpacity
              onPress={() => {
                setShowQuoteModal(false)
                setQuoteError(null)
              }}
              className='w-10 h-10 rounded-full justify-center items-center'
            >
              <Ionicons name='chevron-back' size={20} color='white' />
            </TouchableOpacity>
            <Text className='text-white text-lg font-semibold'>Swap Quote</Text>
            <View className='w-10' />
          </View>

          <View className='flex-1 px-6'>
            {/* Swap Summary */}
            <View className='bg-secondary-light rounded-2xl p-4 mb-4'>
              <Text className='text-white font-semibold mb-3'>
                Swap Summary
              </Text>

              {/* From */}
              <View className='flex-row items-center justify-between mb-3'>
                <View className='flex-row items-center flex-1'>
                  <View className='w-10 h-10 bg-secondary-light rounded-full justify-center items-center mr-3 overflow-hidden'>
                    {inputToken?.logoURI ? (
                      <Image
                        source={{ uri: inputToken.logoURI }}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                        placeholder={{ blurhash: blurHashPlaceholder }}
                      />
                    ) : (
                      <Text className='text-lg font-bold text-primary-400'>
                        {inputToken?.symbol?.charAt(0) || '?'}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text className='text-white font-semibold'>
                      {inputAmount} {inputToken?.symbol}
                    </Text>
                    <Text className='text-gray-400 text-sm'>
                      ${getInputUsdValue().toFixed(2)}
                    </Text>
                  </View>
                </View>
                <Text className='text-gray-400'>From</Text>
              </View>

              <View className='items-center mb-3'>
                <Ionicons name='arrow-down' size={20} color='#666672' />
              </View>

              {/* To */}
              <View className='flex-row items-center justify-between'>
                <View className='flex-row items-center flex-1'>
                  <View className='w-10 h-10 bg-secondary-light rounded-full justify-center items-center mr-3 overflow-hidden'>
                    {outputToken?.logo_uri ? (
                      <Image
                        source={{ uri: outputToken.logo_uri }}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                        placeholder={{ blurhash: blurHashPlaceholder }}
                      />
                    ) : (
                      <Text className='text-lg font-bold text-primary-400'>
                        {outputToken?.symbol?.charAt(0) || '?'}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text className='text-white font-semibold'>
                      {formatNumber(
                        Number(jupiterQuote?.outAmount || 0) / 1e6 ||
                          Number(outputAmount)
                      )}{' '}
                      {outputToken?.symbol}
                    </Text>
                    <Text className='text-gray-400 text-sm'>
                      $
                      {formatNumber(jupiterQuote?.outUsdValue) ||
                        getOutputUsdValue().toFixed(2)}
                    </Text>
                  </View>
                </View>
                <Text className='text-gray-400'>To</Text>
              </View>
            </View>

            {/* Quote Details */}
            {isGettingQuote ? (
              <View className='bg-secondary-light rounded-2xl p-6 mb-4'>
                <Text className='text-white font-semibold mb-4'>
                  Getting Best Quote...
                </Text>
                <View className='gap-3'>
                  {/* Skeleton loaders */}
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      className='flex-row justify-between items-center'
                    >
                      <View className='w-20 h-4 bg-primary-500/10 rounded animate-pulse' />
                      <View className='w-16 h-4 bg-primary-500/10 rounded animate-pulse' />
                    </View>
                  ))}
                </View>
                <View className='flex-row items-center justify-center mt-4'>
                  <ActivityIndicator size='small' color='#6366f1' />
                  <Text className='text-gray-400 ml-2'>
                    Finding optimal route...
                  </Text>
                </View>
              </View>
            ) : jupiterQuote ? (
              <View className='bg-secondary-light rounded-2xl p-4 mb-4'>
                <Text className='text-white font-semibold mb-3'>
                  Quote Details
                </Text>
                <View className='gap-y-3'>
                  <View className='flex-row justify-between'>
                    <Text className='text-gray-400'>Rate</Text>
                    <Text className='text-white'>
                      1 {inputToken?.symbol} ={' '}
                      {jupiterQuote
                        ? (
                            parseFloat(jupiterQuote.outAmount) /
                            Math.pow(10, outputToken?.decimals || 9) /
                            parseFloat(inputAmount)
                          ).toFixed(6)
                        : '0'}{' '}
                      {outputToken?.symbol}
                    </Text>
                  </View>
                  <View className='flex-row justify-between'>
                    <Text className='text-gray-400'>Price Impact</Text>
                    <Text
                      className={`${parseFloat(jupiterQuote.priceImpactPct) < 1 ? 'text-success-400' : parseFloat(jupiterQuote.priceImpactPct) < 3 ? 'text-warning-400' : 'text-danger-400'}`}
                    >
                      {parseFloat(jupiterQuote.priceImpactPct).toFixed(4)}%
                    </Text>
                  </View>
                  <View className='flex-row justify-between'>
                    <Text className='text-gray-400'>Slippage Tolerance</Text>
                    <Text className='text-white'>
                      {(jupiterQuote.slippageBps / 100).toFixed(2)}%
                    </Text>
                  </View>
                  <View className='flex-row justify-between'>
                    <Text className='text-gray-400'>Route</Text>
                    <Text className='text-white'>
                      {jupiterQuote.routePlan[0]?.swapInfo.label || 'Direct'}
                    </Text>
                  </View>
                  <View className='flex-row justify-between'>
                    <Text className='text-gray-400'>Minimum Received</Text>
                    <Text className='text-white'>
                      {(
                        parseFloat(jupiterQuote.otherAmountThreshold) /
                        Math.pow(10, outputToken?.decimals || 9)
                      ).toFixed(6)}{' '}
                      {outputToken?.symbol}
                    </Text>
                  </View>
                  <View className='flex-row justify-between'>
                    <Text className='text-gray-400'>You will receive</Text>
                    <Text className='text-white font-semibold'>
                      {formatNumber(
                        Number(jupiterQuote?.outAmount || 0) / 1e6 ||
                          Number(outputAmount)
                      )}{' '}
                      {outputToken?.symbol}
                    </Text>
                  </View>
                  <View className='flex-row justify-between'>
                    <Text className='text-gray-400'>Worth</Text>
                    <Text className='text-white font-semibold'>
                      ~$
                      {(jupiterQuote?.outUsdValue || 0).toLocaleString(
                        'en-US',
                        {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        }
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            ) : quoteError ? (
              <View className='bg-secondary-light rounded-2xl p-6 mb-4'>
                <View className='items-center'>
                  <Ionicons name='warning-outline' size={48} color='#ef4444' />
                  <Text className='text-white text-lg font-semibold mt-4'>
                    Quote Failed
                  </Text>
                  <Text className='text-gray-400 text-center mt-2'>
                    {quoteError}
                  </Text>
                  <TouchableOpacity
                    className='bg-primary-500 rounded-xl px-6 py-3 mt-4'
                    onPress={getJupiterQuote}
                  >
                    <View className='flex-row items-center'>
                      <Ionicons name='refresh' size={16} color='white' />
                      <Text className='text-white font-medium ml-2'>
                        Retry Quote
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className='bg-secondary-light rounded-2xl p-6 mb-4'>
                <Text className='text-gray-400 text-center'>
                  No quote available. Please try again.
                </Text>
              </View>
            )}

            {/* Swap Button */}
            <CustomButton
              className='mt-auto mb-6'
              type='primary'
              text={
                jupiterQuote && !quoteError ? 'Confirm Swap' : 'Quote Required'
              }
              onPress={executeSwap}
              disabled={!jupiterQuote || isSwapping || !!quoteError}
              loading={isSwapping}
            />
            {/* <TouchableOpacity
              className={`rounded-2xl p-4 mt-auto mb-6 ${
                jupiterQuote && !isSwapping && !quoteError
                  ? 'bg-primary-500'
                  : 'bg-gray-600'
              }`}
              onPress={executeSwap}
              disabled={!jupiterQuote || isSwapping || !!quoteError}
            >
              <Text className='text-white font-semibold text-center text-lg'>
                {jupiterQuote && !quoteError
                  ? 'Confirm Swap'
                  : 'Quote Required'}
              </Text>
            </TouchableOpacity> */}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Loading Modal */}
      <TransactionLoadingModal
        visible={showLoadingModal}
        label='Processing your swap...'
      />

      {/* Success Modal */}
      <TransactionSuccessModal
        visible={showSuccessModal}
        txSignature={txSignature}
        onClose={handleCloseSuccess}
      />
    </SafeAreaView>
  )
}
