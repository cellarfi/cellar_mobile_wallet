import { customAlphabet, customRandom, nanoid, random } from 'nanoid'

export const generateRandomNumber = (length: number) => {
  return customRandom('0123456789', length, random)
}

export const generateRandomString = (length: number) => {
  return nanoid(length)
}

export const generateReferralCode = customAlphabet(
  'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  10
)
