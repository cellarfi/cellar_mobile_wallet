import { AddressBookModel } from '@/models/address.model'
import {
  createAddressBookSchema,
  UpdateAddressBookDto,
  updateAddressBookSchema,
} from '@/utils/dto/addressBook.dto'
import { Request, Response } from 'express'

/**
 * Get all address book entries for a user
 */
export const getAddressBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.user!.id

    if (!id) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    const entries = await AddressBookModel.getAllEntries(id)

    res.json({
      success: true,
      data: entries,
    })
  } catch (err: any) {
    console.error('[getAddressBook] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred retrieving the address book',
    })
  }
}

/**
 * Get a specific address book entry
 */
export const getAddressBookEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.user!.id

    if (!id) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    const { entry_id } = req.params

    const entry = await AddressBookModel.getEntryById(id, entry_id)

    if (!entry) {
      res.status(404).json({
        success: false,
        error: 'Address book entry not found',
      })
      return
    }

    res.json({
      success: true,
      data: entry,
    })
  } catch (err: any) {
    console.error('[getAddressBookEntry] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred retrieving the address book entry',
    })
  }
}

/**
 * Create a new address book entry
 */
export const createAddressBookEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.user!.id

    const { success, data, error } =
      await createAddressBookSchema.safeParseAsync({
        ...req.body,
        user_id: id,
      })
    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    const entry = await AddressBookModel.createEntry(data)

    res.status(201).json({
      success: true,
      data: entry,
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'Address book entry already exists',
      })
      return
    }

    console.error('[createAddressBookEntry] Error:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'An error occurred creating the address book entry',
    })
  }
}

/**
 * Update an existing address book entry
 */
export const updateAddressBookEntry = async (
  req: Request<{ entry_id: string }, {}, UpdateAddressBookDto>,
  res: Response
): Promise<void> => {
  try {
    const { entry_id } = req.params
    const { success, data, error } =
      await updateAddressBookSchema.safeParseAsync({
        ...req.body,
        user_id: req.user!.id,
      })
    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    const updatedEntry = await AddressBookModel.updateEntry(entry_id, data)

    res.json({
      success: true,
      data: updatedEntry,
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'Address book entry already exists',
      })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Address book entry not found or does not belong to this user',
      })
      return
    }

    console.error('[updateAddressBookEntry] Error:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'An error occurred updating the address book entry',
    })
  }
}

/**
 * Delete an address book entry
 */
export const deleteAddressBookEntry = async (
  req: Request<{ entry_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { entry_id } = req.params

    const id = req.user!.id

    await AddressBookModel.deleteEntry(id, entry_id)

    res.status(204).json({
      success: true,
      data: null,
    })
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Address book entry not found or does not belong to this user',
      })
      return
    }

    console.error('[deleteAddressBookEntry] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred deleting the address book entry',
    })
  }
}
