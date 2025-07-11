import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'

interface Tab {
  id: string
  url: string
  title: string
  isLoading: boolean
  progress: number
  canGoBack: boolean
  canGoForward: boolean
}

export default function BrowserScreen() {
  const { url: initialUrl, title: initialTitle } = useLocalSearchParams<{
    url?: string
    title?: string
  }>()

  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [showTabManager, setShowTabManager] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isEditingUrl, setIsEditingUrl] = useState(false)

  const webViewRefs = useRef<{ [key: string]: WebView }>({})

  // Initialize with initial URL or empty tab
  useEffect(() => {
    if (initialUrl) {
      createNewTab(initialUrl, initialTitle || 'New Tab')
    } else {
      createNewTab('about:blank', 'New Tab')
    }
  }, [initialUrl, initialTitle])

  const createNewTab = (url: string, title: string = 'New Tab') => {
    const newTab: Tab = {
      id: Date.now().toString(),
      url: url === 'about:blank' ? '' : url,
      title,
      isLoading: false,
      progress: 0,
      canGoBack: false,
      canGoForward: false,
    }

    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
    setUrlInput(newTab.url)
  }

  const closeTab = (tabId: string) => {
    setTabs((prev) => {
      const newTabs = prev.filter((tab) => tab.id !== tabId)

      // If closing active tab, switch to another tab or create new one
      if (tabId === activeTabId) {
        if (newTabs.length > 0) {
          const newActiveTab = newTabs[newTabs.length - 1]
          setActiveTabId(newActiveTab.id)
          setUrlInput(newActiveTab.url)
        } else {
          // If no tabs left, create a new empty tab
          createNewTab('about:blank', 'New Tab')
          return newTabs
        }
      }

      return newTabs
    })

    // Clean up WebView ref
    delete webViewRefs.current[tabId]
  }

  const switchToTab = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId)
    if (tab) {
      setActiveTabId(tabId)
      setUrlInput(tab.url)
      setShowTabManager(false)
    }
  }

  const updateTab = (tabId: string, updates: Partial<Tab>) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab))
    )
  }

  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return

    let finalUrl = urlInput.trim()

    // Add https:// if no protocol is specified
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      // Check if it looks like a domain
      if (finalUrl.includes('.') || finalUrl.includes('localhost')) {
        finalUrl = 'https://' + finalUrl
      } else {
        // Treat as search query
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`
      }
    }

    if (activeTab) {
      updateTab(activeTab.id, { url: finalUrl, isLoading: true, progress: 0 })
      setUrlInput(finalUrl)

      // Navigate WebView to new URL
      const webView = webViewRefs.current[activeTab.id]
      if (webView) {
        webView.stopLoading()
        webView.injectJavaScript(`window.location.href = "${finalUrl}";`)
      }
    }

    setIsEditingUrl(false)
  }

  const goBack = () => {
    if (activeTab?.canGoBack) {
      const webView = webViewRefs.current[activeTab.id]
      webView?.goBack()
    }
  }

  const goForward = () => {
    if (activeTab?.canGoForward) {
      const webView = webViewRefs.current[activeTab.id]
      webView?.goForward()
    }
  }

  const reload = () => {
    if (activeTab) {
      const webView = webViewRefs.current[activeTab.id]
      webView?.reload()
    }
  }

  const TabItem = ({ tab, isActive }: { tab: Tab; isActive: boolean }) => (
    <View
      className={`bg-dark-200 rounded-2xl p-4 mr-3 w-48 ${
        isActive ? 'border-2 border-primary-500' : ''
      }`}
    >
      <View className='flex-row items-center justify-between mb-2'>
        <View className='flex-row items-center flex-1'>
          <Text
            className='text-white font-medium text-sm flex-1'
            numberOfLines={1}
          >
            {tab.title}
          </Text>
          {tab.isLoading && (
            <ActivityIndicator
              size={12}
              color='#6366f1'
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
        <TouchableOpacity onPress={() => closeTab(tab.id)} className='ml-2'>
          <Ionicons name='close' size={16} color='#666672' />
        </TouchableOpacity>
      </View>
      <View className='mb-3 relative'>
        {/* Progress Background for Tab URL */}
        {tab.isLoading && (
          <View className='absolute inset-0 flex-row rounded-lg overflow-hidden'>
            <View
              className='bg-primary-500/15 transition-all duration-300'
              style={{
                width: `${Math.min(tab.progress * 100, tab.progress === 0 ? 10 : 100)}%`,
              }}
            />
          </View>
        )}
        <View className='px-2 py-1 relative z-10'>
          <Text className='text-gray-400 text-xs' numberOfLines={1}>
            {tab.url || 'about:blank'}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        className={`py-2 px-3 rounded-xl ${
          isActive ? 'bg-primary-500' : 'bg-dark-300'
        }`}
        onPress={() => switchToTab(tab.id)}
      >
        <Text
          className={`text-center text-sm font-medium ${
            isActive ? 'text-white' : 'text-gray-400'
          }`}
        >
          {isActive ? 'Active' : 'Switch'}
        </Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView className='flex-1 bg-dark-50' edges={['top']}>
      <StatusBar barStyle='light-content' backgroundColor='#0a0a0b' />

      {/* Top Toolbar */}
      <View className='bg-dark-100 border-b border-dark-300 px-4 py-2'>
        <View className='flex-row items-center'>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className='w-8 h-8 justify-center items-center mr-3'
          >
            <Ionicons name='close' size={20} color='white' />
          </TouchableOpacity>

          {/* Navigation Controls */}
          <TouchableOpacity
            onPress={goBack}
            disabled={!activeTab?.canGoBack}
            className={`w-8 h-8 justify-center items-center mr-2 ${
              !activeTab?.canGoBack ? 'opacity-30' : ''
            }`}
          >
            <Ionicons name='arrow-back' size={18} color='white' />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goForward}
            disabled={!activeTab?.canGoForward}
            className={`w-8 h-8 justify-center items-center mr-3 ${
              !activeTab?.canGoForward ? 'opacity-30' : ''
            }`}
          >
            <Ionicons name='arrow-forward' size={18} color='white' />
          </TouchableOpacity>

          {/* URL Bar */}
          <View className='flex-1 bg-dark-200 rounded-2xl mr-3 overflow-hidden relative'>
            {/* Progress Background */}
            {activeTab?.isLoading && (
              <View className='absolute inset-0 flex-row'>
                <View
                  className={`transition-all duration-300 ease-out ${
                    isEditingUrl ? 'bg-primary-500/30' : 'bg-primary-500/20'
                  }`}
                  style={{
                    width: `${Math.min(activeTab.progress * 100, activeTab.progress === 0 ? 15 : 100)}%`,
                  }}
                />
                {/* Subtle shimmer effect when starting to load */}
                {activeTab.progress === 0 && (
                  <View className='absolute inset-0'>
                    <View
                      className={`w-full h-full animate-pulse ${
                        isEditingUrl
                          ? 'bg-gradient-to-r from-primary-500/15 via-primary-500/30 to-primary-500/15'
                          : 'bg-gradient-to-r from-primary-500/10 via-primary-500/20 to-primary-500/10'
                      }`}
                    />
                  </View>
                )}
              </View>
            )}
            <View className='px-3 py-2 relative z-10'>
              <TextInput
                className='text-white text-sm'
                value={isEditingUrl ? urlInput : activeTab?.url || ''}
                onChangeText={setUrlInput}
                onFocus={() => setIsEditingUrl(true)}
                onBlur={() => setIsEditingUrl(false)}
                onSubmitEditing={handleUrlSubmit}
                placeholder='Search or enter URL...'
                placeholderTextColor='#666672'
                autoCapitalize='none'
                autoCorrect={false}
                returnKeyType='go'
                style={{ backgroundColor: 'transparent' }}
              />
            </View>
          </View>

          {/* Reload Button */}
          <TouchableOpacity
            onPress={reload}
            className='w-8 h-8 justify-center items-center mr-2'
          >
            {activeTab?.isLoading ? (
              <ActivityIndicator size={16} color='#6366f1' />
            ) : (
              <Ionicons name='refresh' size={16} color='white' />
            )}
          </TouchableOpacity>

          {/* Tab Manager */}
          {/* <TouchableOpacity
            onPress={() => setShowTabManager(true)}
            className='bg-dark-300 px-2 py-1 rounded-lg flex-row items-center'
          >
            <Text className='text-white text-xs font-medium mr-1'>
              {tabs.length}
            </Text>
            <Ionicons name='copy-outline' size={14} color='white' />
          </TouchableOpacity> */}
        </View>
      </View>

      {/* WebView Container */}
      <View className='flex-1'>
        {tabs.map((tab) => (
          <View
            key={tab.id}
            className='absolute inset-0'
            style={{
              display: tab.id === activeTabId ? 'flex' : 'none',
            }}
          >
            {tab.url ? (
              <WebView
                ref={(ref) => {
                  if (ref) webViewRefs.current[tab.id] = ref
                }}
                source={{ uri: tab.url }}
                style={{ flex: 1 }}
                onLoadStart={() =>
                  updateTab(tab.id, { isLoading: true, progress: 0 })
                }
                onLoadProgress={(event) =>
                  updateTab(tab.id, { progress: event.nativeEvent.progress })
                }
                onLoadEnd={() =>
                  updateTab(tab.id, { isLoading: false, progress: 1 })
                }
                onNavigationStateChange={(navState) => {
                  updateTab(tab.id, {
                    canGoBack: navState.canGoBack,
                    canGoForward: navState.canGoForward,
                    title: navState.title || tab.title,
                    url: navState.url,
                  })
                  if (tab.id === activeTabId) {
                    setUrlInput(navState.url)
                  }
                }}
                onError={() => {
                  updateTab(tab.id, { isLoading: false, progress: 0 })
                  Alert.alert('Error', 'Failed to load page')
                }}
                allowsBackForwardNavigationGestures
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                userAgent='Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
              />
            ) : (
              <View className='flex-1 justify-center items-center bg-dark-50'>
                <Ionicons name='globe-outline' size={64} color='#666672' />
                <Text className='text-gray-400 text-lg mt-4'>
                  Enter a URL to browse
                </Text>
                <Text className='text-gray-500 text-sm mt-2 text-center px-8'>
                  Type a website address or search term in the address bar above
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Tab Manager Modal */}
      <Modal
        visible={showTabManager}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <SafeAreaView className='flex-1 bg-dark-50'>
          <View className='flex-row items-center justify-between px-6 py-4 border-b border-dark-300'>
            <Text className='text-white text-xl font-bold'>
              Tabs ({tabs.length})
            </Text>
            <View className='flex-row gap-3'>
              <TouchableOpacity
                onPress={() => createNewTab('about:blank', 'New Tab')}
                className='w-10 h-10 bg-primary-500 rounded-full justify-center items-center'
              >
                <Ionicons name='add' size={20} color='white' />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowTabManager(false)}
                className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'
              >
                <Ionicons name='close' size={20} color='white' />
              </TouchableOpacity>
            </View>
          </View>

          {tabs.length > 0 ? (
            <FlatList
              data={tabs}
              renderItem={({ item }) => (
                <TabItem tab={item} isActive={item.id === activeTabId} />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 24 }}
            />
          ) : (
            <View className='flex-1 justify-center items-center'>
              <Ionicons name='copy-outline' size={64} color='#666672' />
              <Text className='text-gray-400 text-lg mt-4'>No tabs open</Text>
              <TouchableOpacity
                onPress={() => createNewTab('about:blank', 'New Tab')}
                className='bg-primary-500 px-6 py-3 rounded-2xl mt-6'
              >
                <Text className='text-white font-medium'>Create New Tab</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions */}
          <View className='px-6 pb-6'>
            <Text className='text-white text-lg font-bold mb-4'>
              Quick Actions
            </Text>
            <View className='flex-row gap-3'>
              <TouchableOpacity
                onPress={() => {
                  createNewTab('about:blank', 'New Tab')
                  setShowTabManager(false)
                }}
                className='flex-1 bg-dark-200 rounded-2xl p-4 items-center'
              >
                <Ionicons name='add-circle-outline' size={24} color='#6366f1' />
                <Text className='text-white font-medium mt-2'>New Tab</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (tabs.length > 1) {
                    tabs.forEach((tab) => {
                      if (tab.id !== activeTabId) {
                        closeTab(tab.id)
                      }
                    })
                  }
                  setShowTabManager(false)
                }}
                className='flex-1 bg-dark-200 rounded-2xl p-4 items-center'
              >
                <Ionicons
                  name='close-circle-outline'
                  size={24}
                  color='#ef4444'
                />
                <Text className='text-white font-medium mt-2'>
                  Close Others
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}
