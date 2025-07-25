import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';

type CopyToClipboardOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  field?: string;
};

export function useClipboard(initialField: string | null = null) {
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(initialField);

  const copyToClipboard = async (text: string, options: CopyToClipboardOptions = {}) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setCopiedText(text);
      
      // Set the copied field if provided
      if (options.field) {
        setCopiedField(options.field);
      }
      
      // Call success callback if provided
      options.onSuccess?.();
      
      // Reset the copied state after 2 seconds
      const resetTimer = setTimeout(() => {
        setCopied(false);
        setCopiedText('');
        setCopiedField(null);
      }, 2000);
      
      // Return cleanup function to clear timeout if component unmounts
      return () => clearTimeout(resetTimer);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      options.onError?.(error);
      return false;
    }
  };

  return { 
    copyToClipboard, 
    copied, 
    copiedText, 
    copiedField,
    setCopied,
    setCopiedField 
  };
}

// For one-off copy operations (useful for class components or outside React components)
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
