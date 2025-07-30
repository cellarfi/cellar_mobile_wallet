import { requireNativeModule } from 'expo-modules-core'

export interface ShortcutResult {
  success: boolean
  id: string
  title: string
}

export interface StandaloneWebAppResult extends ShortcutResult {
  id: string
  success: boolean
  package: string
  url: string
  title: string
}

export default class ShortcutModule {
  static async createShortcut(url: string): Promise<ShortcutResult> {
    return await requireNativeModule('Shortcut').createShortcut(url)
  }

  static async createStandaloneWebApp(
    url: string
  ): Promise<StandaloneWebAppResult> {
    return await requireNativeModule('Shortcut').createStandaloneWebApp(url)
  }
}
