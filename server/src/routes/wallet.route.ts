import {
  createAddressBookEntry,
  deleteAddressBookEntry,
  getAddressBook,
  getAddressBookEntry,
  updateAddressBookEntry,
} from '@/controllers/addressBookController'
import {
  getWalletHistory,
  getWalletPortfolio,
} from '@/controllers/walletController'
import { authMiddleware } from '@/middleware/auth.middleware'
import { Router } from 'express'

const router = Router()

router.get('/portfolio/:walletAddress', getWalletPortfolio)
router.get('/history/:walletAddress', getWalletHistory)

// Add address book routes under /api/wallet/address-book

// Get all address book entries for a user
router.get('/address-book/', authMiddleware(), getAddressBook)

// Get a specific address book entry
router.get('/address-book/:entryId', authMiddleware(), getAddressBookEntry)

// Create a new address book entry
router.post('/address-book/', authMiddleware(), createAddressBookEntry)

// Update an existing address book entry
router.patch('/address-book/:entryId', authMiddleware(), updateAddressBookEntry)

// Delete an address book entry
router.delete('/address-book/:entryId', authMiddleware(), deleteAddressBookEntry)

export default router
