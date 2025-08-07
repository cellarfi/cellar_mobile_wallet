// Reexport the native module. On web, it will be resolved to ShortcutModule.web.ts
// and on native platforms to ShortcutModule.ts
export { default } from './src/ShortcutModule';
export { default as ShortcutView } from './src/ShortcutView';
export * from  './src/Shortcut.types';
