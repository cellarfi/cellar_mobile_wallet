import { router, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'

export default function BrowserRedirect() {
  const { url, title } = useLocalSearchParams<{
    url?: string
    title?: string
  }>()

  useEffect(() => {
    console.log(
      'BrowserRedirect: Received deep link with url:',
      url,
      'title:',
      title
    )

    if (url) {
      // Redirect to the modal browser with the same parameters
      router.replace({
        pathname: '/(modals)/browser' as any,
        params: { url, title },
      })
    }
  }, [url, title])

  return null
}
