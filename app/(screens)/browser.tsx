import solanaSdk from '@/assets/solanaSdk-1.95.4.min.js.raw'
import BrowserToolbar from '@/components/core/browser/BrowserToolbar'
import { Colors } from '@/constants/Colors'
import { useDappMethods } from '@/hooks/useDappMethods'
import { useRandomSecret } from '@/hooks/useRandomSecret'
import { getInjectedScriptString } from '@/libs/dappScript'
import { useRecentDappsStore } from '@/store/recentDappsStore'
import { useWebviewStore } from '@/store/webviewStore'
import { BrowserTab } from '@/types/app.interface'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'

export default function BrowserScreen() {
  const { url: initialUrl, title: initialTitle } = useLocalSearchParams<{
    url?: string
    title?: string
  }>()
  const secret = useRandomSecret()

  const [tabs, setTabs] = useState<BrowserTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [showTabManager, setShowTabManager] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  const { setTab } = useWebviewStore()
  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  const webViewRefs = useRef<{ [key: string]: WebView }>({})
  const { onMessage, disconnect } = useDappMethods(webViewRefs, secret)
  const { addRecentDapp } = useRecentDappsStore()

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  // Initialize with initial URL or empty tab
  useEffect(() => {
    if (initialUrl) {
      createNewTab(initialUrl, initialTitle || 'New Tab')
    } else {
      createNewTab('about:blank', 'New Tab')
    }
  }, [initialUrl, initialTitle])

  const createNewTab = (url: string, title: string = 'New Tab') => {
    const newTab: BrowserTab = {
      id: Date.now().toString(),
      url: url === 'about:blank' ? '' : url,
      baseUrl: url === 'about:blank' ? '' : new URL(url)?.origin || '',
      domain: url === 'about:blank' ? '' : new URL(url)?.hostname || '',
      title,
      isLoading: false,
      progress: 0,
      canGoBack: false,
      canGoForward: false,
    }

    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
    setTab(newTab)
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
      setTab(tab)
    }
  }

  const updateTab = (tabId: string, updates: Partial<BrowserTab>) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab))
    )
  }

  const TabItem = ({
    tab,
    isActive,
  }: {
    tab: BrowserTab
    isActive: boolean
  }) => (
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
    <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
      <StatusBar
        barStyle='light-content'
        backgroundColor={Colors.dark.primary}
      />

      {/* Top Toolbar */}
      <BrowserToolbar
        webViewRefs={webViewRefs}
        urlInput={urlInput}
        setUrlInput={setUrlInput}
        isEditingUrl={isEditingUrl}
        setIsEditingUrl={setIsEditingUrl}
        activeTab={activeTab}
        updateTab={updateTab}
      />

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
                allowsBackForwardNavigationGestures
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                pullToRefreshEnabled
                setSupportMultipleWindows={false}
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
                onLoadEnd={() => {
                  updateTab(tab.id, { isLoading: false, progress: 1 })
                  // Save to recent dApps
                  if (tab.url && tab.url !== 'about:blank') {
                    try {
                      const urlObj = new URL(tab.url)
                      addRecentDapp({
                        url: tab.url,
                        title: tab.title || urlObj.hostname,
                        domain: urlObj.hostname,
                        favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`,
                      })
                    } catch {
                      // Invalid URL, skip saving
                    }
                  }
                }}
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
                // onMessage={handleMessage}
                onMessage={onMessage}
                injectedJavaScriptBeforeContentLoaded={`
                    window.onerror = function(message, sourcefile, lineno, colno, error) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'js-error',
                        message: message,
                        sourcefile: sourcefile,
                        lineno: lineno,
                        colno: colno,
                        error: error,
                      }))
                      return true;
                    };
                    true;`}
                injectedJavaScript={getInjectedScriptString(
                  secret,
                  Platform.OS,
                  solanaSdk
                )}
                onError={() => {
                  updateTab(tab.id, { isLoading: false, progress: 0 })
                  Alert.alert('Error', 'Failed to load page')
                }}
                // renderError={(errorName, errorDomain, errorDesc) => (
                //   <WebViewError
                //     message={errorDesc || errorName || 'Failed to load page'}
                //     onRetry={() => reload()}
                //   />
                // )}
              />
            ) : (
              <View className='flex-1 justify-center items-center bg-primary-main'>
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
