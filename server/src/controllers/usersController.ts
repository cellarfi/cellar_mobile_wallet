import { ERROR_MESSAGES } from '@/constants/app.constants'
import { UsersModel } from '@/models/user.model'
import prismaService from '@/service/prismaService'
import { TapestryService } from '@/service/tapestryService'
import { parseUserInclude, UserIncludeQuery } from '@/types/include.types'
import {
  CreateUserDto,
  createUserSchema,
  CreateUserWalletDto,
  createUserWalletSchema,
  UpdateUserDefaultWalletDto,
  updateUserDefaultWalletSchema,
  UpdateUserDto,
  updateUserSchema,
} from '@/utils/dto/users.dto'
import { Request, Response } from 'express'

const prisma = prismaService.prisma

export const getProfile = async (
  req: Request<{}, {}, {}, UserIncludeQuery>,
  res: Response,
): Promise<void> => {
  try {
    const user_id = req.user!.id

    // Parse include parameters from query string
    const includeParams = parseUserInclude(req.query)

    const user = await UsersModel.getUserById(user_id, includeParams)

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      })
      return
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (err: any) {
    console.error('[getProfile] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred retrieving the user profile',
    })
  }
}

export const getUserByTagName = async (
  req: Request<{ tag_name: string }, {}, {}, UserIncludeQuery>,
  res: Response,
): Promise<void> => {
  try {
    const tag_name = req.params.tag_name
    if (!tag_name) {
      res.status(400).json({
        success: false,
        error: 'Tag name is required',
      })
      return
    }

    // Parse include parameters from query string
    const includeParams = parseUserInclude(req.query)

    const user = await UsersModel.getUserByTagName(
      tag_name,
      includeParams,
      req.user?.id,
    )
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      })
      return
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (err: any) {
    console.error('[getUserByTagName] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred retrieving the user by tag name',
    })
  }
}

export const getUserByTagNameV2 = async (
  req: Request<{ tag_name: string }, {}, {}, UserIncludeQuery>,
  res: Response,
): Promise<void> => {
  try {
    const tag_name = req.params.tag_name
    if (!tag_name) {
      res.status(400).json({
        success: false,
        error: 'Tag name is required',
      })
      return
    }

    const includeParams = parseUserInclude(req.query)
    const user = await UsersModel.getUserByTagName(
      tag_name,
      includeParams,
      req.user?.id,
    )
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      })
      return
    }

    let _count = user._count
    if (user.tapestry_profile_id) {
      try {
        const details = await TapestryService.getProfileDetails(
          user.tapestry_profile_id,
        )
        const counts = (details as any)?.socialCounts
        if (
          counts &&
          typeof counts.followers === 'number' &&
          typeof counts.following === 'number'
        ) {
          _count = {
            ...user._count,
            followers: counts.followers,
            following: counts.following,
          }
        }
      } catch (tapErr) {
        console.error(
          '[getUserByTagNameV2] Tapestry getProfileDetails failed:',
          tapErr,
        )
        // keep local _count on Tapestry failure
      }
    }

    // Attach latest credibility score if available and visible
    const credibility = await (prisma as any).credibilityScore.findUnique({
      where: {
        user_id: user.id,
      },
    })

    let credibility_score: number = 0
    let credibility_breakdown: {
      call_accuracy: number
      follower_credibility: number
      engagement_quality: number
    } = {
      call_accuracy: 0,
      follower_credibility: 0,
      engagement_quality: 0,
    }

    if (credibility) {
      credibility_score = Number(credibility.score)
      credibility_breakdown = {
        call_accuracy: credibility.call_accuracy
          ? Number(credibility.call_accuracy)
          : 0,
        follower_credibility: credibility.follower_credibility
          ? Number(credibility.follower_credibility)
          : 0,
        engagement_quality: credibility.engagement_quality
          ? Number(credibility.engagement_quality)
          : 0,
      }
    }

    res.json({
      success: true,
      data: {
        ...user,
        _count,
        credibility_score: null,
        credibility_breakdown: null,
      },
    })
  } catch (err: any) {
    console.error('[getUserByTagNameV2] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred retrieving the user by tag name',
    })
  }
}

export const checkIfTagNameExists = async (
  req: Request<{ tag_name: string }>,
  res: Response,
): Promise<void> => {
  try {
    const tag_name = req.params.tag_name
    if (!tag_name) {
      res.status(400).json({
        success: false,
        error: 'Tag name is required',
      })
      return
    }

    const user = await UsersModel.getUserByTagName(tag_name)
    res.json({
      success: true,
      exists: !!user,
    })
  } catch (err: any) {
    console.error('[tagNameExists] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred',
    })
  }
}

export const createUser = async (
  req: Request<{}, {}, CreateUserDto>,
  res: Response,
): Promise<void> => {
  try {
    const id = req.user!.id
    if (!req.body.referred_by) delete req.body.referred_by

    const { success, data, error } = await createUserSchema.safeParseAsync({
      ...req.body,
      id,
      created_at:
        req.user?.createdAt?.toISOString() || new Date().toISOString(),
    })
    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    const user = await UsersModel.createUser(data)
    const wallet = await UsersModel.createUserWallet({
      user_id: user.id,
      chain_type: req.user!.wallet!.chainType,
      address: req.user!.wallet!.address,
      is_default: true,
    })

    // Best-effort registration of Tapestry profile
    let tapestryProfileId: string | undefined
    try {
      const profile = await TapestryService.findOrCreateProfile({
        walletAddress: req.user!.wallet!.address,
        username: user.tag_name,
        displayName: user.display_name,
        avatarUrl: user.profile_picture_url,
        bio: user.about ?? undefined,
        properties: [
          { key: 'referral_code', value: user.referral_code ?? '' },
          { key: 'referred_by', value: user.referred_by ?? '' },
        ],
      })

      tapestryProfileId = profile.id

      await UsersModel.setTapestryProfileId(user.id, profile.id)
    } catch (tapestryError) {
      console.error(
        '[createUser] Error registering Tapestry profile:',
        tapestryError,
      )
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          ...user,
          tapestry_profile_id: tapestryProfileId ?? user.tapestry_profile_id,
          wallet,
        },
      },
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      console.log(err)
      res.status(409).json({
        success: false,
        error: 'User already exists',
      })
      return
    }

    if (err.code === 'P2003') {
      console.log('err.code', err)
      if (err?.meta?.constraint === 'users_referred_by_fkey') {
        res.status(409).json({
          success: false,
          error: 'Referral code is invalid',
        })
        return
      }

      return
    }

    console.error('[createUser] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred creating the user',
    })
  }
}

export const createUserWallet = async (
  req: Request<{}, {}, CreateUserWalletDto>,
  res: Response,
): Promise<void> => {
  try {
    const { success, data, error } =
      await createUserWalletSchema.safeParseAsync({
        ...req.body,
      })
    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    const wallet = await UsersModel.createUserWallet(data)

    res.status(201).json({
      success: true,
      data: wallet,
    })
  } catch (err: any) {
    console.error('[createUserWallet] Error:', err)
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'User wallet already exists',
      })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'User not found',
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'An error occurred creating the user wallet',
    })
  }
}

export const updateUserDefaultWallet = async (
  req: Request<{}, {}, UpdateUserDefaultWalletDto>,
  res: Response,
): Promise<void> => {
  try {
    const id = req.user!.id

    const { success, data, error } =
      await updateUserDefaultWalletSchema.safeParseAsync({
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

    const wallet = await UsersModel.updateUserDefaultWallet(data)

    res.status(201).json({
      success: true,
      data: wallet,
    })
  } catch (err: any) {
    console.error('[updateUserDefaultWallet] Error:', err)
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'User or wallet not found',
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'An error occurred updating the user default wallet',
    })
  }
}

export const updateProfile = async (
  req: Request<{}, {}, UpdateUserDto>,
  res: Response,
): Promise<void> => {
  try {
    const id = req.user!.id
    console.log('req.body', req.body)
    const { success, data, error } = await updateUserSchema.safeParseAsync({
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

    const updatedUser = await UsersModel.updateUser(id, {
      ...data,
    })

    // Best-effort sync of profile updates to Tapestry
    try {
      if (updatedUser.tapestry_profile_id) {
        await TapestryService.updateProfile(updatedUser.tapestry_profile_id, {
          username: updatedUser.tag_name,
          displayName: updatedUser.display_name,
          avatarUrl: updatedUser.profile_picture_url,
          bio: updatedUser.about ?? undefined,
        })
      }
    } catch (tapestryError) {
      console.error(
        '[updateProfile] Error updating Tapestry profile:',
        tapestryError,
      )
    }

    res.json({
      success: true,
      data: updatedUser,
    })
  } catch (err: any) {
    console.error('[updateProfile] Error:', err)

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'User not found',
      })
      return
    }

    // Handle tag name update time limit error
    if (
      err.message &&
      err.message.includes(ERROR_MESSAGES.TAG_NAME_UPDATE_LIMIT)
    ) {
      res.status(400).json({
        success: false,
        error: err.message,
      })
      return
    }

    res.status(500).json({
      success: false,
      error: "An error occurred updating the user's profile",
    })
  }
}

export const deleteAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user_id = req.user!.id
    await UsersModel.deleteUser(user_id)

    res.status(204)
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'User not found',
      })
      return
    }

    console.error('[deleteUser] Error:', err)
    res.status(500).json({
      success: false,
      error: "An error occurred deleting the user's account",
    })
  }
}

export const searchUsers = async (
  req: Request<{}, {}, {}, { query: string }>,
  res: Response,
): Promise<void> => {
  try {
    const query = req.query.query

    if (!query) {
      res.status(400).json({
        success: false,
        error: 'Search query is required',
      })
      return
    }

    const users = await UsersModel.searchUser(query)

    res.status(200).json({
      success: true,
      data: users,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'An error occurred searching for users.',
    })
  }
}

export const registerTapestryProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id

    const user = await UsersModel.getUserById(userId)
    console.log('user', req.user!.wallet!.address)

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      })
      return
    }

    console.log('defaultWallet', req.user!.wallet!.address)
    if (!req.user!.wallet!.address) {
      res.status(400).json({
        success: false,
        error: 'User has no wallet to associate with Tapestry profile',
      })
      return
    }
    const profile = await TapestryService.findOrCreateProfile({
      walletAddress: req.user!.wallet!.address,
      username: user.tag_name,
      displayName: user.display_name,
      avatarUrl: user.profile_picture_url,
      bio: user.about ?? undefined,
    })

    const updatedUser = await UsersModel.setTapestryProfileId(
      user.id,
      profile.id,
    )

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
      },
    })
  } catch (err: any) {
    console.error('[registerTapestryProfile] Error:', err)
    res.status(502).json({
      success: false,
      error: err.message || 'Failed to register Tapestry profile',
    })
  }
}

export const getUserProfile = async (
  req: Request<{ tag_name: string }, {}, {}, {}>,
  res: Response,
): Promise<void> => {
  try {
    const user_id = req.user!.id
    const { tag_name } = req.params

    if (!tag_name) {
      res.status(400).json({
        success: false,
        error: 'ID query is required',
      })
      return
    }

    const data = await UsersModel.getUserProfile(tag_name, user_id)

    res.status(200).json({
      success: true,
      data: data,
    })
  } catch (error) {
    console.error('[getUserProfile] Error:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred getting the user profile',
    })
  }
}
