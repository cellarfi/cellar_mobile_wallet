import { requireNativeView } from 'expo';
import * as React from 'react';

import { ShortcutViewProps } from './Shortcut.types';

const NativeView: React.ComponentType<ShortcutViewProps> =
  requireNativeView('Shortcut');

export default function ShortcutView(props: ShortcutViewProps) {
  return <NativeView {...props} />;
}
