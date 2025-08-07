import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import {
  AccountInfo,
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'

// Common Solana program IDs
const PROGRAM_IDS = {
  TOKEN_PROGRAM: TOKEN_PROGRAM_ID.toString(),
  ASSOCIATED_TOKEN_PROGRAM: ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
  SYSTEM_PROGRAM: '11111111111111111111111111111112',
  RENT_PROGRAM: 'SysvarRent111111111111111111111111111111111',
  CLOCK_PROGRAM: 'SysvarC1ock11111111111111111111111111111111',
  // Add more program IDs as needed
  JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  RAYDIUM_AMM: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  ORCA: '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP',
}

// Transaction effect types
export interface TokenChange {
  mint: string
  symbol?: string
  decimals?: number
  amount: string
  direction: 'in' | 'out'
  tokenAccount?: string
}

export interface SolChange {
  amount: string
  direction: 'in' | 'out'
}

export interface TransactionEffects {
  solChanges: SolChange[]
  tokenChanges: TokenChange[]
  accountsCreated: string[]
  accountsClosed: string[]
  programsInvolved: string[]
  instructionTypes: string[]
}

export class TransactionAnalyzer {
  private connection: Connection
  private userPublicKey: PublicKey

  constructor(connection: Connection, userPublicKey: string) {
    this.connection = connection
    this.userPublicKey = new PublicKey(userPublicKey)
  }

  async analyzeTransaction(
    transaction: Transaction | VersionedTransaction
  ): Promise<TransactionEffects> {
    const effects: TransactionEffects = {
      solChanges: [],
      tokenChanges: [],
      accountsCreated: [],
      accountsClosed: [],
      programsInvolved: [],
      instructionTypes: [],
    }

    try {
      // Get all accounts involved in the transaction
      const accountKeys = this.getAccountKeys(transaction)

      // Get account info for all accounts before simulation
      const accountInfos = await this.getAccountInfos(accountKeys)

      let simulation
      if (transaction instanceof VersionedTransaction) {
        simulation = await this.connection.simulateTransaction(transaction, {
          sigVerify: false,
          accounts: {
            encoding: 'base64',
            addresses: accountKeys.map((key) => key.toString()),
          },
        })
      } else {
        simulation = await this.connection.simulateTransaction(
          transaction,
          [], // signers
          true // includeAccounts
        )
      }

      if (simulation.value.err) {
        console.warn('Transaction simulation failed:', simulation.value.err)
        // Still try to analyze what we can from the instructions
      }

      console.log('simulation accounts', simulation.value.accounts)
      console.log(
        'simulation innerInstructions',
        simulation.value.innerInstructions
      )
      console.log('simulation returnData', simulation.value.returnData)
      console.log('simulation unitsConsumed', simulation.value.unitsConsumed)
      console.log('simulation logs', simulation.value.logs)

      // Analyze instructions
      const instructions = this.getInstructions(transaction)

      for (const instruction of instructions) {
        const programId = instruction.programId.toString()
        effects.programsInvolved.push(programId)

        // Analyze based on program type
        await this.analyzeInstruction(instruction, effects, accountInfos)
      }

      // Analyze simulation results for balance changes
      if (simulation.value.accounts) {
        await this.analyzeBalanceChanges(
          simulation.value.accounts,
          accountInfos,
          effects
        )
      }

      // Remove duplicates
      effects.programsInvolved = [...new Set(effects.programsInvolved)]
      effects.instructionTypes = [...new Set(effects.instructionTypes)]
    } catch (error) {
      console.error('Error analyzing transaction:', error)
    }

    return effects
  }

  private getAccountKeys(
    transaction: Transaction | VersionedTransaction
  ): PublicKey[] {
    if (transaction instanceof VersionedTransaction) {
      return transaction.message.staticAccountKeys
    } else {
      return transaction.instructions.flatMap((ix) => [
        ix.programId,
        ...ix.keys.map((key) => key.pubkey),
      ])
    }
  }

  private getInstructions(transaction: Transaction | VersionedTransaction) {
    if (transaction instanceof VersionedTransaction) {
      return transaction.message.compiledInstructions.map((ix, index) => {
        const accountKeys = transaction.message.staticAccountKeys
        return {
          programId: accountKeys[ix.programIdIndex],
          keys: ix.accountKeyIndexes.map((keyIndex) => ({
            pubkey: accountKeys[keyIndex],
            isSigner: false, // Simplified for analysis
            isWritable: false,
          })),
          data: ix.data,
        }
      })
    } else {
      return transaction.instructions
    }
  }

  private async getAccountInfos(accountKeys: PublicKey[]) {
    const accountInfos = new Map<string, AccountInfo<Buffer> | null>()

    try {
      const infos = await this.connection.getMultipleAccountsInfo(accountKeys)
      accountKeys.forEach((key, index) => {
        accountInfos.set(key.toString(), infos[index])
      })
    } catch (error) {
      console.error('Error fetching account infos:', error)
    }

    return accountInfos
  }

  private async analyzeInstruction(
    instruction: any,
    effects: TransactionEffects,
    accountInfos: Map<string, AccountInfo<Buffer> | null>
  ) {
    const programId = instruction.programId.toString()

    switch (programId) {
      case PROGRAM_IDS.TOKEN_PROGRAM:
        this.analyzeTokenInstruction(instruction, effects)
        break
      case PROGRAM_IDS.SYSTEM_PROGRAM:
        this.analyzeSystemInstruction(instruction, effects)
        break
      case PROGRAM_IDS.ASSOCIATED_TOKEN_PROGRAM:
        effects.instructionTypes.push('Create Associated Token Account')
        break
      case PROGRAM_IDS.JUPITER_V6:
        effects.instructionTypes.push('Jupiter Swap')
        break
      case PROGRAM_IDS.RAYDIUM_AMM:
        effects.instructionTypes.push('Raydium Swap')
        break
      case PROGRAM_IDS.ORCA:
        effects.instructionTypes.push('Orca Swap')
        break
      default:
        effects.instructionTypes.push(
          `Unknown Program: ${programId.slice(0, 8)}...`
        )
    }
  }

  private analyzeTokenInstruction(
    instruction: any,
    effects: TransactionEffects
  ) {
    // This is simplified - you'd need to properly decode the instruction data
    // For a full implementation, you'd use @solana/spl-token to decode instructions

    const data = instruction.data
    if (!data || data.length === 0) return

    // Token instruction types (simplified)
    const instructionType = data[0]

    switch (instructionType) {
      case 3: // Transfer
        effects.instructionTypes.push('Token Transfer')
        break
      case 7: // MintTo
        effects.instructionTypes.push('Mint Tokens')
        break
      case 8: // Burn
        effects.instructionTypes.push('Burn Tokens')
        break
      case 9: // CloseAccount
        effects.instructionTypes.push('Close Token Account')
        break
      default:
        effects.instructionTypes.push('Token Operation')
    }
  }

  private analyzeSystemInstruction(
    instruction: any,
    effects: TransactionEffects
  ) {
    const data = instruction.data
    if (!data || data.length === 0) return

    const instructionType = data.readUInt32LE(0)

    switch (instructionType) {
      case 0: // CreateAccount
        effects.instructionTypes.push('Create Account')
        effects.accountsCreated.push(
          instruction.keys[1]?.pubkey?.toString() || ''
        )
        break
      case 2: // Transfer
        effects.instructionTypes.push('SOL Transfer')
        // You could extract the amount from the instruction data here
        break
      default:
        effects.instructionTypes.push('System Operation')
    }
  }

  private async analyzeBalanceChanges(
    simulatedAccounts: any[],
    originalAccountInfos: Map<string, AccountInfo<Buffer> | null>,
    effects: TransactionEffects
  ) {
    // This would compare pre and post simulation account states
    // to determine actual balance changes

    for (const account of simulatedAccounts) {
      if (account.owner === PROGRAM_IDS.TOKEN_PROGRAM) {
        // This is a token account - analyze token balance changes
        try {
          const parsed = account.data.parsed
          if (parsed?.info?.tokenAmount) {
            // You'd compare with original balance to determine change
            effects.tokenChanges.push({
              mint: parsed.info.mint,
              amount: parsed.info.tokenAmount.amount,
              direction: 'in', // Simplified - you'd calculate actual direction
              tokenAccount: account.pubkey,
            })
          }
        } catch (error) {
          console.error('Error parsing token account:', error)
        }
      }
    }
  }
}
