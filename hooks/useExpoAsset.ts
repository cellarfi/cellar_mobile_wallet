import { Asset } from 'expo-asset'
import { readAsStringAsync } from 'expo-file-system'
import { useEffect, useState } from 'react'

export const useExpoAsset = (asset: string) => {
  const [fileContent, setFileContent] = useState('')

  useEffect(() => {
    async function loadTextFile() {
      try {
        // Get the asset from the module system
        const asset = Asset.fromModule(require('./assets/myTextFile.txt'))

        // Download the asset to a local URI
        await asset.downloadAsync()

        if (asset.localUri) {
          // Read the content of the file
          const contents = await readAsStringAsync(asset.localUri)
          setFileContent(contents)
        }
      } catch (error) {
        console.error('Error loading text file:', error)
      }
    }

    loadTextFile()
  }, [])

  return { fileContent }
}
