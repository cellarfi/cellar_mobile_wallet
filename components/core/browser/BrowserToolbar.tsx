import ShortcutModule from '@/modules/shortcut'
import { BrowserTab } from '@/types/app.interface'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { RefObject, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import WebView from 'react-native-webview'

interface Props {
  webViewRefs: RefObject<{ [key: string]: WebView }>
  urlInput: string
  setUrlInput: (url: string) => void
  isEditingUrl: boolean
  setIsEditingUrl: (isEditingUrl: boolean) => void
  activeTab: BrowserTab | undefined
  updateTab: (tabId: string, updates: Partial<BrowserTab>) => void
}

const BrowserToolbar = ({
  webViewRefs,
  urlInput,
  setUrlInput,
  isEditingUrl,
  setIsEditingUrl,
  activeTab,
  updateTab,
}: Props) => {
  const [showMenu, setShowMenu] = useState(false)
  const [isAddingToHomeScreen, setIsAddingToHomeScreen] = useState(false)

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return

    let finalUrl = urlInput.trim()

    // Add https:// if no protocol is specified
    // if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    //   // Check if it looks like a domain
    //   if (finalUrl.includes('.') || finalUrl.includes('localhost')) {
    //     finalUrl = 'https://' + finalUrl
    //   } else {
    //     // Treat as search query
    //     finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`
    //   }
    // }

    if (!/^https?:\/\//i.test(finalUrl)) {
      if (finalUrl.includes('.') || finalUrl.includes('localhost')) {
        finalUrl = 'https://' + finalUrl
      } else {
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

  const addToHomeScreen = async () => {
    if (!activeTab?.url) return
    setIsAddingToHomeScreen(true)
    try {
      await ShortcutModule.createShortcut(activeTab.url)
      // await ShortcutModule.createStandaloneWebApp(activeTab.url)
      setShowMenu(false)
    } catch (error) {
      console.error('Failed to add to home screen:', error)
    } finally {
      setIsAddingToHomeScreen(false)
    }
  }

  const menuItems = [
    {
      label: 'Reload',
      onPress: reload,
      icon: <Ionicons name='refresh' size={20} color='white' />,
    },
    {
      label: 'Add to Home Screen',
      onPress: addToHomeScreen,
      icon: <Ionicons name='add-circle' size={20} color='white' />,
    },
  ]

  return (
    <View className='bg-secondary-light border-b border-dark-300 px-4 py-2'>
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
        <View className='flex-1 bg-secondary-disabled rounded-2xl mr-3 overflow-hidden relative'>
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
          <View className='px-3 relative z-10'>
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
        {/* <TouchableOpacity
          onPress={reload}
          className='w-8 h-8 justify-center items-center mr-2'
        >
          {activeTab?.isLoading ? (
            <ActivityIndicator size={16} color='#6366f1' />
          ) : (
            <Ionicons name='refresh' size={16} color='white' />
          )}
        </TouchableOpacity> */}

        {Platform.OS === 'android' ? (
          <>
            <TouchableOpacity
              onPress={() => setShowMenu(true)}
              className='w-8 h-8 justify-center items-center mr-2'
            >
              <Ionicons name='ellipsis-vertical' size={20} color='white' />
            </TouchableOpacity>
            <Modal
              visible={showMenu}
              transparent
              animationType='fade'
              onRequestClose={() => setShowMenu(false)}
            >
              <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                <View className='flex-1 bg-black/20'>
                  <TouchableWithoutFeedback>
                    <View className='absolute top-[53px] right-5 bg-[#22223b] rounded-xl py-2 px-4 min-w-[180px] shadow-lg'>
                      {menuItems.map((item, index) => (
                        <React.Fragment key={item.label}>
                          <TouchableOpacity
                            onPress={item.onPress}
                            className='flex-row items-center gap-2 py-2'
                          >
                            {item.label === 'Add to Home Screen' &&
                            isAddingToHomeScreen ? (
                              <ActivityIndicator
                                size='small'
                                color='white'
                                className='mr-[8px]'
                              />
                            ) : (
                              <>{item.icon}</>
                            )}
                            <Text style={{ color: 'white', fontSize: 16 }}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                          {index < menuItems.length - 1 && (
                            <View
                              style={{
                                height: 1,
                                backgroundColor: '#444',
                                marginVertical: 4,
                              }}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </>
        ) : (
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
        )}

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
  )
}

export default BrowserToolbar
