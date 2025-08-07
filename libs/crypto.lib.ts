import {
  CryptoDigestAlgorithm,
  CryptoEncoding,
  digestStringAsync,
} from 'expo-crypto'

// Utility to XOR two Buffers
export const xorBuffers = (
  buffer: Buffer,
  pad: number,
  length: number
): Buffer => {
  const result = Buffer.alloc(length)
  for (let i = 0; i < length; i++) {
    result[i] = (buffer[i] || 0) ^ pad
  }
  return result
}

// Replicate HMAC-SHA256 using expo-crypto
export async function hmacSha256(
  key: Buffer,
  message: string
): Promise<string> {
  const blockSize = 64 // SHA-256 block size in bytes
  let keyBuffer = key

  // If key is longer than block size, hash it first
  if (key.length > blockSize) {
    const keyHash = await digestStringAsync(
      CryptoDigestAlgorithm.SHA256,
      key.toString('binary'),
      { encoding: CryptoEncoding.HEX }
    )
    keyBuffer = Buffer.from(keyHash, 'hex')
  }

  // Pad key to block size with zeros if shorter
  if (keyBuffer.length < blockSize) {
    keyBuffer = Buffer.concat([
      keyBuffer,
      Buffer.alloc(blockSize - keyBuffer.length),
    ])
  }

  // Inner and outer pads
  const innerPad = xorBuffers(keyBuffer, 0x36, blockSize)
  const outerPad = xorBuffers(keyBuffer, 0x5c, blockSize)

  // Inner hash: SHA256(innerPad || message)
  const innerHash = await digestStringAsync(
    CryptoDigestAlgorithm.SHA256,
    innerPad.toString('binary') + message,
    { encoding: CryptoEncoding.HEX }
  )

  // Outer hash: SHA256(outerPad || innerHash)
  const outerHash = await digestStringAsync(
    CryptoDigestAlgorithm.SHA256,
    outerPad.toString('binary') +
      Buffer.from(innerHash, 'hex').toString('binary'),
    { encoding: CryptoEncoding.HEX }
  )

  return outerHash
}
