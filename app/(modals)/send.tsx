import ContactCard from '@/components/ContactCard';
import SendTokenSelector from '@/components/SendTokenSelector';
import TransactionLoadingModal from '@/components/TransactionLoadingModal';
import TransactionSuccessModal from '@/components/TransactionSuccessModal';
import CustomButton from '@/components/ui/CustomButton';
import { blurHashPlaceholder } from '@/constants/App';
import { ENV } from '@/constants/Env';
import { useRefetchContext } from '@/contexts/RefreshProvider';
import { useAddress } from '@/hooks/useAddress';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { usePortfolio } from '@/hooks/usePortfolio';
import { userRequests } from '@/libs/api_requests/user.request';
import {
  calculateFee,
  getConnection,
  isValidSolanaAddress,
  NATIVE_SOL_MINT,
  sendNativeSol,
  WRAPPED_SOL_MINT,
} from '@/libs/solana.lib';
import { SendSplToken } from '@/libs/spl.helpers';
import { useAuthStore } from '@/store/authStore';
import { BirdEyeTokenItem, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import {
  formatWalletAddress,
  useEmbeddedSolanaWallet,
  usePrivy,
} from '@privy-io/expo';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SendScreen() {
  const {
    portfolio,
    isLoading: portfolioLoading,
    isRefetching,
  } = usePortfolio();

  const {
    addresses,
    isLoading: addressesLoading,
    refetch: refetchAddresses,
  } = useAddress();

  const { refetchPortfolio } = useRefetchContext();
  const { activeWallet } = useAuthStore();
  const { user } = usePrivy();
  const { wallets } = useEmbeddedSolanaWallet();
  const [selectedToken, setSelectedToken] = useState<BirdEyeTokenItem | null>(
    null
  );
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [isUsdMode, setIsUsdMode] = useState(false);
  const [addressValidation, setAddressValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
  }>({ isValidating: false, isValid: null });

  // Tag name resolution state
  const [isResolvingTagName, setIsResolvingTagName] = useState(false);
  const [resolvedTagUser, setResolvedTagUser] = useState<User | null>(null);
  const [tagResolutionError, setTagResolutionError] = useState<string | null>(
    null
  );
  const [transactionFee, setTransactionFee] = useState<number | null>(null);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Modal states
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [txSignature, setTxSignature] = useState<string>('');

  // Get route parameters for address selection and QR scanning
  const {
    recipient: selectedRecipient,
    scannedAddress,
    selectedToken: selectedTokenParam,
    // State restoration parameters from QR scanner
    currentRecipient,
    currentAmount,
    currentMemo,
    currentIsUsdMode,
  } = useLocalSearchParams<{
    recipient?: string;
    scannedAddress?: string;
    selectedToken?: string;
    currentRecipient?: string;
    currentAmount?: string;
    currentMemo?: string;
    currentIsUsdMode?: string;
  }>();

  // Debug route parameters
  useEffect(() => {
    console.log('Send screen route params:', {
      selectedRecipient,
      scannedAddress,
      selectedTokenParam,
      currentRecipient,
      currentAmount,
      currentMemo,
      currentIsUsdMode,
    });
  }, [
    selectedRecipient,
    scannedAddress,
    selectedTokenParam,
    currentRecipient,
    currentAmount,
    currentMemo,
    currentIsUsdMode,
  ]);

  // Handle preselected token from token detail page
  useEffect(() => {
    if (selectedTokenParam && selectedTokenParam !== 'undefined') {
      try {
        const parsedToken: BirdEyeTokenItem = JSON.parse(selectedTokenParam);
        console.log('Preselecting token:', parsedToken);
        setSelectedToken(parsedToken);
        // Clear the parameter to avoid re-triggering
        router.setParams({ selectedToken: undefined });
      } catch (error) {
        console.error('Failed to parse selectedToken parameter:', error);
      }
    }
  }, [selectedTokenParam]);

  // Load address book on component mount
  useEffect(() => {
    console.log('Loading address book for send screen...');
    refetchAddresses();
  }, [refetchAddresses]);

  // Handle selected recipient from address book
  useEffect(() => {
    console.log('Processing selected recipient:', {
      selectedRecipient,
      type: typeof selectedRecipient,
      length: selectedRecipient?.length,
    });

    if (selectedRecipient && selectedRecipient !== 'undefined') {
      console.log('Setting recipient to:', selectedRecipient);
      setRecipient(selectedRecipient);
      // Clear the parameter to avoid re-triggering
      router.setParams({ recipient: undefined });
    }
  }, [selectedRecipient]);

  // Handle scanned address from QR scanner
  useEffect(() => {
    console.log('Processing scanned address:', {
      scannedAddress,
      type: typeof scannedAddress,
      length: scannedAddress?.length,
    });

    if (scannedAddress && scannedAddress !== 'undefined') {
      console.log('Setting recipient to scanned address:', scannedAddress);
      setRecipient(scannedAddress);
      // Clear the parameter to avoid re-triggering
      router.setParams({ scannedAddress: undefined });
    }
  }, [scannedAddress]);

  // Restore form state when returning from QR scanner
  useEffect(() => {
    if (currentRecipient && currentRecipient !== 'undefined') {
      console.log('Restoring form state from QR scanner');
      // Only restore if we haven't already set a recipient from scanning
      if (!scannedAddress) {
        setRecipient(currentRecipient);
      }
    }
    if (currentAmount && currentAmount !== 'undefined') {
      setAmount(currentAmount);
    }
    if (currentMemo && currentMemo !== 'undefined') {
      setMemo(currentMemo);
    }
    if (currentIsUsdMode && currentIsUsdMode !== 'undefined') {
      setIsUsdMode(currentIsUsdMode === 'true');
    }

    // Clear restoration parameters
    if (currentRecipient || currentAmount || currentMemo || currentIsUsdMode) {
      router.setParams({
        currentRecipient: undefined,
        currentAmount: undefined,
        currentMemo: undefined,
        currentIsUsdMode: undefined,
      });
    }
  }, [
    currentRecipient,
    currentAmount,
    currentMemo,
    currentIsUsdMode,
    scannedAddress,
  ]);

  // Get recent contacts (limit to 5 most recent)
  const recentContacts = useMemo(() => {
    return addresses.slice(0, 5);
  }, [addresses]);

  // Handle "See All" navigation
  const handleSeeAllContacts = () => {
    router.push({
      pathname: '/(modals)/address-book' as any,
      params: {
        selectMode: 'true',
        onSelect: JSON.stringify({
          screen: 'send',
          param: 'recipient',
        }),
      },
    });
  };

  // Handle refresh addresses
  const handleRefreshAddresses = () => {
    refetchAddresses();
  };

  // Handle QR scanner navigation
  const handleOpenQRScanner = () => {
    const params = {
      returnTo: 'send',
      returnParam: 'scannedAddress',
      // Pass current form data to preserve state
      currentRecipient: recipient,
      currentAmount: amount,
      currentMemo: memo,
      currentIsUsdMode: isUsdMode.toString(),
    };

    console.log('Send screen: Opening QR scanner with params:', params);

    router.push({
      pathname: '/(modals)/qr-scanner' as any,
      params,
    });
  };

  // Debug logging
  useEffect(() => {
    console.log('Wallet debug info:', {
      user: !!user,
      activeWallet: !!activeWallet,
      activeWalletAddress: activeWallet?.address,
      wallets: wallets?.length || 0,
    });
  }, [user, activeWallet, wallets]);

  // Get available tokens from portfolio
  const availableTokens = useMemo(() => {
    if (!portfolio?.items) return [];
    return portfolio.items.filter((item) => item.balance > 0);
  }, [portfolio]);

  // Show empty state if no portfolio data and not loading
  const showEmptyState = !portfolio && !portfolioLoading;

  // Select default token (SOL first, then first available) - but only if no token preselected
  useEffect(() => {
    // Don't run default selection if we have a preselected token parameter
    if (selectedTokenParam && selectedTokenParam !== 'undefined') {
      return;
    }

    if (availableTokens.length > 0 && !selectedToken) {
      const nativeSol = availableTokens.find(
        (token) =>
          token.address === NATIVE_SOL_MINT ||
          token.address === WRAPPED_SOL_MINT
      );

      if (nativeSol) {
        setSelectedToken(nativeSol);
      } else {
        setSelectedToken(availableTokens[0]);
      }
    }
  }, [availableTokens, selectedToken, selectedTokenParam]);

  // Validate recipient address or resolve tag name
  useEffect(() => {
    // Reset resolved tag user and error when recipient changes
    setResolvedTagUser(null);
    setTagResolutionError(null);

    if (!recipient || recipient.trim() === '') {
      setAddressValidation({ isValidating: false, isValid: null });
      return;
    }

    // If it starts with @, we'll handle it separately in the onBlur event
    if (recipient.trim().startsWith('@')) {
      // Don't validate as Solana address yet
      setAddressValidation({ isValidating: false, isValid: null });
      return;
    }

    setAddressValidation({ isValidating: true, isValid: null });

    const timeoutId = setTimeout(() => {
      const isValid = isValidSolanaAddress(recipient.trim());
      setAddressValidation({ isValidating: false, isValid });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [recipient]);

  // Function to extract Solana address from a resolved user
  const getSolanaAddressFromUser = (user: User | null): string | null => {
    if (!user) return null;
    return (
      user.wallets?.find((wallet) => wallet.chain_type === 'solana')?.address ||
      null
    );
  };

  // Function to resolve tag name to a Solana address
  const resolveTagName = async (tagName: string) => {
    if (!tagName.startsWith('@') || tagName.length <= 1) {
      return;
    }

    // Extract tag name without @ symbol
    const cleanTagName = tagName.substring(1).trim();

    // Only proceed if tag name has sufficient length
    if (cleanTagName.length < 3) {
      return;
    }

    try {
      setIsResolvingTagName(true);
      setResolvedTagUser(null);
      setTagResolutionError(null);

      // Call the API to find user by tag name
      const response = await userRequests.getUserByTagName(cleanTagName);

      if (response.success && response.data) {
        setResolvedTagUser(response.data);
      } else {
        setTagResolutionError(response.message || 'Failed to resolve tag name');
      }
    } catch (error: any) {
      console.error('Error resolving tag name:', error);
      setTagResolutionError(error?.message || 'Failed to resolve tag name');
    } finally {
      setIsResolvingTagName(false);
    }
  };

  // Debounced version of resolveTagName
  const debouncedResolveTagName = useDebouncedCallback(resolveTagName, 500);

  // Handle recipient input change
  const handleRecipientChange = (text: string) => {
    setRecipient(text);

    // Reset resolved user if input is changed
    if (resolvedTagUser) {
      setResolvedTagUser(null);
      setTagResolutionError(null);
    }

    // Trigger tag name resolution if input starts with @ and has at least 3 chars after @
    const trimmedText = text.trim();
    if (trimmedText.startsWith('@') && trimmedText.length > 3) {
      debouncedResolveTagName(trimmedText);
    }
  };

  // Handle recipient input blur event to resolve tag names
  const handleRecipientBlur = async () => {
    if (recipient.trim().startsWith('@')) {
      await resolveTagName(recipient.trim());
    }
  };

  // Function to use the resolved address
  const setRecipientToResolvedAddress = () => {
    const resolvedAddress = getSolanaAddressFromUser(resolvedTagUser);
    if (resolvedAddress) {
      setRecipient(resolvedAddress);
    }
  };

  const formatBalance = (balance: number, decimals: number = 9) => {
    return balance / Math.pow(10, decimals);
  };

  const getTokenBalance = () => {
    if (!selectedToken) return 0;
    return formatBalance(selectedToken.balance, selectedToken.decimals);
  };

  const isSOLToken = (token: BirdEyeTokenItem) => {
    return token.address === NATIVE_SOL_MINT;
  };

  const getUsdValue = (tokenAmount: number) => {
    if (!selectedToken?.priceUsd) return 0;
    return tokenAmount * selectedToken.priceUsd;
  };

  const getTokenAmountFromUsd = (usdAmount: number) => {
    if (!selectedToken?.priceUsd) return 0;
    return usdAmount / selectedToken.priceUsd;
  };

  const calculateDisplayValues = () => {
    if (!amount || !selectedToken) return { tokenAmount: 0, usdAmount: 0 };

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return { tokenAmount: 0, usdAmount: 0 };

    if (isUsdMode) {
      const tokenAmount = getTokenAmountFromUsd(numAmount);
      return { tokenAmount, usdAmount: numAmount };
    } else {
      const usdAmount = getUsdValue(numAmount);
      return { tokenAmount: numAmount, usdAmount };
    }
  };

  const { tokenAmount, usdAmount } = calculateDisplayValues();
  const tokenBalance = getTokenBalance();
  const isInsufficientFunds = tokenAmount > tokenBalance;

  // Get SOL token from portfolio for USD price conversion
  const solToken = useMemo(() => {
    if (!portfolio?.items) return null;
    return portfolio.items.find(
      (token) =>
        token.address === NATIVE_SOL_MINT || token.address === WRAPPED_SOL_MINT
    );
  }, [portfolio]);

  // Convert fee to USD if SOL price is available
  const formatNetworkFee = () => {
    if (transactionFee === null) return '~0.000005 SOL';

    const solFeeText = `${transactionFee} SOL`;

    if (solToken?.priceUsd) {
      const feeInUsd = transactionFee * solToken.priceUsd;
      return `${solFeeText} (~$${feeInUsd?.toFixed(6)})`;
    }

    return solFeeText;
  };

  // Reusable transaction builder method
  const buildTransaction = async (
    token: BirdEyeTokenItem,
    recipientAddress: string,
    amount: number,
    walletAddress: string
  ): Promise<Transaction> => {
    console.log('Building transaction with:', {
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      recipientAddress,
      amount,
      walletAddress,
      isSOL: isSOLToken(token),
    });

    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }
    if (!recipientAddress) {
      throw new Error('Recipient address is required');
    }
    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }

    const fromPubkey = new PublicKey(walletAddress);
    const toPubkey = new PublicKey(recipientAddress);

    if (isSOLToken(token)) {
      // Build SOL transaction
      console.log('Building SOL transaction');
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      console.log('lamports', {
        amount: lamports,
        fromPubkey,
        toPubkey,
      });
      return await sendNativeSol(new Connection(ENV.RPC_URL), {
        amount: lamports,
        fromPubkey,
        toPubkey,
      });
    } else {
      // Build SPL token transaction
      console.log('Building SPL token transaction');
      const mintAddress = new PublicKey(token.address);
      return await SendSplToken(getConnection(), {
        amount,
        fromPubKey: fromPubkey,
        toPubKey: toPubkey,
        mintAddress,
      });
    }
  };

  // Calculate transaction fee when moving to confirm step
  const calculateTransactionFee = async () => {
    if (!selectedToken || !recipient || !tokenAmount || !activeWallet) return;

    try {
      setCalculatingFee(true);
      setTransactionFee(null);

      const walletAddress = activeWallet?.address;
      if (!walletAddress) {
        throw new Error('No wallet address available');
      }

      console.log('Calculating fee for:', {
        token: selectedToken.symbol,
        recipient,
        tokenAmount,
        walletAddress,
      });

      // Build transaction to calculate fee
      const transaction = await buildTransaction(
        selectedToken,
        recipient,
        tokenAmount,
        walletAddress
      );

      console.log('Transaction built successfully, calculating fee...');
      const fee = await calculateFee(getConnection(), transaction);
      console.log('Fee calculated:', fee, 'lamports');
      setTransactionFee(fee / LAMPORTS_PER_SOL); // Convert from lamports to SOL
    } catch (error: any) {
      console.error('Error calculating fee:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        selectedToken: selectedToken?.symbol,
        recipient,
        tokenAmount,
        walletAddress: activeWallet?.address,
      });
      setTransactionFee(0.000005); // Fallback to default fee
    } finally {
      setCalculatingFee(false);
    }
  };

  const handleSend = async () => {
    if (!recipient || !amount || !selectedToken) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // If recipient is a tag name, prompt to use the resolved address instead
    if (recipient.startsWith('@')) {
      const resolvedAddress = resolvedTagUser?.wallets?.find(
        (wallet) => wallet.chain_type === 'solana'
      )?.address;
      if (resolvedAddress) {
        Alert.alert(
          'Use Resolved Address',
          `Would you like to send to ${resolvedTagUser.display_name || resolvedTagUser.tag_name}'s address (${formatWalletAddress(resolvedAddress)}) instead?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Use Address',
              onPress: () => {
                setRecipientToResolvedAddress();
                // Don't continue with transaction yet, let the user verify the address first
              },
            },
          ]
        );
        return;
      } else if (!isResolvingTagName) {
        // If not currently resolving and no resolved user, show error
        Alert.alert(
          'Error',
          'Please resolve a valid tag name or Solana address'
        );
        return;
      }
    } else if (addressValidation.isValid === false) {
      Alert.alert('Error', 'Please enter a valid Solana address');
      return;
    }

    if (isInsufficientFunds) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setStep('confirm');
    // Calculate fee when moving to confirm step
    await calculateTransactionFee();
  };

  const handleConfirmSend = async () => {
    if (!selectedToken || !recipient || !tokenAmount || !activeWallet) {
      Alert.alert('Error', 'Missing required transaction data');
      return;
    }

    if (!wallets || wallets.length === 0) {
      Alert.alert('Error', 'No wallet available for signing transactions');
      return;
    }

    try {
      setIsSending(true);
      setShowLoadingModal(true);

      // Get the wallet provider
      const provider = await wallets?.[0]?.getProvider();
      if (!provider) {
        throw new Error('No wallet provider available');
      }

      // Build the transaction
      const transaction = await buildTransaction(
        selectedToken,
        recipient,
        tokenAmount,
        activeWallet?.address
      );

      // Send the transaction using Privy
      const result = await provider.request({
        method: 'signAndSendTransaction',
        params: {
          transaction,
          connection: getConnection(),
        },
      });

      // Success - show success modal
      setTxSignature(result.signature);
      setShowLoadingModal(false);
      setShowSuccessModal(true);

      // Trigger background portfolio refresh
      refetchPortfolio();
    } catch (error: any) {
      console.error('Error sending transaction:', error);
      setShowLoadingModal(false);
      Alert.alert(
        'Transaction Failed',
        error?.message || 'Failed to send transaction. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    // Navigate back immediately, portfolio refresh continues in background
    router.dismissAll();
  };

  // Only show full loading screen if there's no portfolio data AND we're loading initially
  if (portfolioLoading && !portfolio) {
    return (
      <SafeAreaView className="flex-1 bg-dark-50 justify-center items-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-white mt-4">Loading portfolio...</Text>
      </SafeAreaView>
    );
  }

  // Show empty state if no portfolio data and not loading
  if (showEmptyState) {
    return (
      <SafeAreaView className="flex-1 bg-dark-50">
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-dark-200 rounded-full justify-center items-center"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">Send</Text>
            <View className="w-10" />
          </View>

          <View className="flex-1 justify-center items-center px-6">
            <Ionicons name="wallet-outline" size={64} color="#6b7280" />
            <Text className="text-white text-xl font-semibold mt-4 text-center">
              No Portfolio Data
            </Text>
            <Text className="text-gray-400 text-center mt-2 mb-6">
              Unable to load your portfolio. Please check your connection and
              try again.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'confirm') {
    return (
      <>
        <SafeAreaView className="flex-1 bg-dark-50">
          <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4">
              <TouchableOpacity
                onPress={() => setStep('input')}
                className="w-10 h-10 bg-dark-200 rounded-full justify-center items-center"
              >
                <Ionicons name="arrow-back" size={20} color="white" />
              </TouchableOpacity>
              <Text className="text-white text-lg font-semibold">
                Confirm Transaction
              </Text>
              <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6">
              {/* Transaction Summary */}
              <View className="bg-dark-200 rounded-3xl p-6 mb-6">
                <View className="items-center mb-6">
                  <View className="w-20 h-20 bg-primary-500/20 rounded-full justify-center items-center mb-4 overflow-hidden">
                    {selectedToken?.logoURI ? (
                      <Image
                        source={{ uri: selectedToken.logoURI }}
                        style={{ width: 80, height: 80, borderRadius: 40 }}
                        placeholder={{ blurhash: blurHashPlaceholder }}
                      />
                    ) : (
                      <Text className="text-3xl font-bold text-primary-400">
                        {selectedToken?.symbol?.charAt(0) || '?'}
                      </Text>
                    )}
                  </View>
                  <Text className="text-white text-3xl font-bold">
                    {tokenAmount?.toFixed(6)} {selectedToken?.symbol}
                  </Text>
                  <Text className="text-gray-400 text-lg">
                    ≈ ${usdAmount?.toFixed(2)}
                  </Text>
                </View>

                <View className="gap-4">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-400">To: </Text>
                    <Text className="text-white font-mono">{recipient}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-400">Network Fee</Text>
                    <View className="flex-row items-center">
                      {calculatingFee ? (
                        <ActivityIndicator size={14} color="#6366f1" />
                      ) : (
                        <Text className="text-white">{formatNetworkFee()}</Text>
                      )}
                    </View>
                  </View>
                  {memo && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-400">Memo</Text>
                      <Text className="text-white">{memo}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Warning */}
              <View className="bg-warning-500/10 border border-warning-500/20 rounded-2xl p-4 mb-6">
                <View className="flex-row items-start">
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                  <View className="flex-1 ml-3">
                    <Text className="text-warning-400 font-medium mb-1">
                      Double-check recipient
                    </Text>
                    <Text className="text-sm text-gray-400">
                      Cryptocurrency transactions are irreversible. Make sure
                      the recipient address is correct.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Confirm Button */}
              <CustomButton
                text={isSending ? 'Sending...' : 'Confirm & Send'}
                onPress={handleConfirmSend}
                disabled={isSending}
                type="primary"
                shallowGradient
              />
            </ScrollView>
          </View>
        </SafeAreaView>

        {/* Modals */}
        <TransactionLoadingModal
          visible={showLoadingModal}
          label="Processing your transaction..."
        />

        <TransactionSuccessModal
          visible={showSuccessModal}
          txSignature={txSignature}
          onClose={handleCloseSuccess}
        />
      </>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-dark-200 rounded-full justify-center items-center"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Send</Text>
          <View className="flex-row gap-3">
            {isRefetching && (
              <View className="w-10 h-10 justify-center items-center">
                <ActivityIndicator size={16} color="#6366f1" />
              </View>
            )}
            <TouchableOpacity
              className="w-10 h-10 bg-dark-200 rounded-full justify-center items-center"
              onPress={handleOpenQRScanner}
            >
              <Ionicons name="scan" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Token Selector */}
          <SendTokenSelector
            selectedToken={selectedToken}
            tokens={availableTokens}
            onTokenSelect={setSelectedToken}
          />

          {/* Address Book Contacts */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-semibold">
                Address Book
              </Text>
              <View className="flex-row items-center gap-3">
                {/* Refresh button */}
                <TouchableOpacity
                  onPress={handleRefreshAddresses}
                  className="w-8 h-8 justify-center items-center"
                  disabled={addressesLoading}
                >
                  {addressesLoading ? (
                    <ActivityIndicator size={16} color="#6366f1" />
                  ) : (
                    <Ionicons name="refresh" size={16} color="#6366f1" />
                  )}
                </TouchableOpacity>

                {/* See All button */}
                {addresses.length > 0 && (
                  <TouchableOpacity
                    onPress={handleSeeAllContacts}
                    className="flex-row items-center"
                  >
                    <Text className="text-primary-400 font-medium mr-1">
                      See All
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#6366f1"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {addressesLoading ? (
              <View className="h-24 justify-center items-center">
                <ActivityIndicator size="small" color="#6366f1" />
                <Text className="text-gray-400 text-sm mt-2">
                  Loading contacts...
                </Text>
              </View>
            ) : recentContacts.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row">
                  {recentContacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onPress={setRecipient}
                    />
                  ))}

                  {/* Add Contact Button */}
                  <TouchableOpacity
                    onPress={handleSeeAllContacts}
                    className="bg-dark-200 rounded-2xl p-4 mr-3 w-32 items-center justify-center border-2 border-dashed border-gray-600"
                  >
                    <Ionicons name="add" size={24} color="#6366f1" />
                    <Text className="text-primary-400 font-medium text-sm mt-2">
                      See All
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <TouchableOpacity
                onPress={handleSeeAllContacts}
                className="bg-dark-200 rounded-2xl p-6 items-center border-2 border-dashed border-gray-600"
              >
                <Ionicons name="people-outline" size={32} color="#6366f1" />
                <Text className="text-white font-medium text-base mt-2">
                  No contacts yet
                </Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Tap to add your first contact
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Recipient */}
          <View className="mb-6">
            <Text className="text-white font-medium mb-2">
              Recipient Address
            </Text>
            <View className="bg-dark-200 rounded-2xl px-4 py-4 flex-row items-center">
              <Ionicons name="person-outline" size={20} color="#666672" />
              <TextInput
                className="flex-1 ml-3 text-white text-lg"
                placeholder="Enter address or @tag_name"
                placeholderTextColor="#666672"
                value={recipient}
                onChangeText={handleRecipientChange}
                onBlur={handleRecipientBlur}
                autoCapitalize="none"
              />
              {/* Address validation indicator */}
              <View className="ml-2">
                {addressValidation.isValidating ? (
                  <ActivityIndicator size={16} color="#6366f1" />
                ) : addressValidation.isValid === true ? (
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                ) : addressValidation.isValid === false ? (
                  <TouchableOpacity
                    onPress={() => setRecipient('')}
                    className="p-1"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            {addressValidation.isValid === false && (
              <Text className="text-red-400 text-sm mt-1">
                Invalid Solana address
              </Text>
            )}

            {/* Tag name resolution status */}
            {isResolvingTagName && (
              <View className="flex-row items-center mt-1">
                <ActivityIndicator size="small" color="#6366f1" />
                <Text className="text-gray-400 text-sm ml-2">
                  Resolving tag name...
                </Text>
              </View>
            )}

            {/* Resolved tag name result */}
            {resolvedTagUser &&
              resolvedTagUser.wallets?.find(
                (wallet) => wallet.chain_type === 'solana'
              )?.address && (
                <View className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-3 mt-1">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-white font-medium">
                        {resolvedTagUser.display_name ||
                          resolvedTagUser.tag_name}
                      </Text>
                      <Text className="text-gray-400 text-sm font-mono">
                        {formatWalletAddress(
                          resolvedTagUser.wallets?.find(
                            (wallet) => wallet.chain_type === 'solana'
                          )?.address
                        )}
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="bg-primary-500 rounded-lg px-3 py-2"
                      onPress={setRecipientToResolvedAddress}
                    >
                      <Text className="text-white font-medium text-sm">
                        Use Address
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            {/* Tag resolution error */}
            {tagResolutionError && (
              <Text className="text-red-400 text-sm mt-1">
                {tagResolutionError}
              </Text>
            )}
          </View>

          {/* Amount */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white font-medium">Amount</Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => setAmount(tokenBalance.toString())}
                >
                  <Text className="text-primary-400 font-medium">Max</Text>
                </TouchableOpacity>
                {/* <TouchableOpacity
                  onPress={() => {
                    setIsUsdMode(!isUsdMode)
                    setAmount('')
                  }}
                  className='bg-dark-300 px-3 py-1 rounded-lg'
                >
                  <Text className='text-white text-sm'>
                    {isUsdMode ? 'USD' : selectedToken?.symbol || 'TOKEN'}
                  </Text>
                </TouchableOpacity> */}
                <TouchableOpacity
                  onPress={() => {
                    setIsUsdMode(!isUsdMode);
                    setAmount('');
                  }}
                  className="bg-dark-300 rounded-2xl flex-row items-center overflow-hidden"
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
            <View className="bg-dark-200 rounded-2xl px-4 py-4 flex-row items-center">
              <TextInput
                className="flex-1 text-white text-2xl font-bold"
                placeholder="0.00"
                placeholderTextColor="#666672"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              <Text className="text-gray-400 text-lg ml-2">
                {isUsdMode ? 'USD' : selectedToken?.symbol}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text
                className={`text-sm ${isInsufficientFunds ? 'text-red-400' : 'text-gray-400'}`}
              >
                {isUsdMode
                  ? `≈ ${tokenAmount?.toFixed(6)} ${selectedToken?.symbol || ''}`
                  : `≈ $${usdAmount?.toFixed(2)}`}
              </Text>
              {isInsufficientFunds && (
                <Text className="text-red-400 text-sm font-medium">
                  Insufficient balance
                </Text>
              )}
            </View>
          </View>

          {/* Memo (Optional) */}
          <View className="mb-8">
            <Text className="text-white font-medium mb-2">Memo (Optional)</Text>
            <View className="bg-dark-200 rounded-2xl px-4 py-4">
              <TextInput
                className="text-white text-lg"
                placeholder="Add a note..."
                placeholderTextColor="#666672"
                value={memo}
                onChangeText={setMemo}
                multiline
                maxLength={100}
              />
            </View>
          </View>

          {/* Send Button */}
          <CustomButton
            text="Review Transaction"
            onPress={handleSend}
            shallowGradient
            disabled={
              !recipient ||
              !amount ||
              addressValidation.isValid !== true ||
              isInsufficientFunds
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
