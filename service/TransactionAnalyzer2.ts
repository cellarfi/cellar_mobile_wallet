import {
  ACCOUNT_SIZE,
  AccountLayout,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import {
  Connection,
  ParsedTransactionWithMeta,
  PublicKey,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from '@solana/web3.js'

export interface BalanceChange {
  amount: number
  closeAuthority: string
  closeAuthorityOption: number
  delegate: string
  delegateOption: number
  delegatedAmount: number
  isNative: number
  isNativeOption: number
  mint: string
  owner: string
  state: number
}

// Enhanced token change detection
export interface EnhancedTokenChange {
  mint: string
  mintAddress: string
  symbol?: string
  decimals?: number
  amount: string
  direction: 'in' | 'out'
  fromTokenAccount?: string
  toTokenAccount?: string
  programUsed?: string
}

export interface EnhancedTransactionEffects {
  solChanges: {
    amount: string
    direction: 'in' | 'out'
    from?: string
    to?: string
  }[]
  tokenChanges: EnhancedTokenChange[]
  swapInfo?: {
    inputToken: string
    outputToken: string
    inputAmount: string
    outputAmount?: string
    platform: string
  }
  accountsCreated: string[]
  accountsClosed: string[]
  programsInvolved: string[]
  instructionTypes: string[]
  decodedInstructions: {
    program: string
    instruction: string
    data: any
  }[]
  balanceChanges: BalanceChange[]
}

// Common program addresses
const PROGRAM_MAP: { [key: string]: string } = {
  ComputeBudget111111111111111111111111111111: 'Compute Budget',
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: 'Token Program',
  ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL: 'Associated Token Program',
  '11111111111111111111111111111112': 'System Program',
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: 'Jupiter Aggregator v6',
  JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB: 'Jupiter Aggregator v4',
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium AMM',
  '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP': 'Orca',
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: 'Orca Whirlpools',
  SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ: 'Saros',
  DF1ow4tspfHX9JwWJsAb9epbkA8hmpSEAtxXy1V27QBH: 'Drift Protocol',
}

export class EnhancedTransactionAnalyzer {
  private connection: Connection
  private userPublicKey: PublicKey

  constructor(connection: Connection, userPublicKey: string) {
    this.connection = connection
    this.userPublicKey = new PublicKey(userPublicKey)
  }

  async analyzeTransaction(
    transaction: Transaction | VersionedTransaction
  ): Promise<EnhancedTransactionEffects> {
    const effects: EnhancedTransactionEffects = {
      solChanges: [],
      tokenChanges: [],
      accountsCreated: [],
      accountsClosed: [],
      programsInvolved: [],
      instructionTypes: [],
      decodedInstructions: [],
      balanceChanges: [],
    }

    try {
      // Get the transaction in a format we can work with
      const serialized = transaction.serialize()

      // Parse the transaction using Connection's parsing capabilities
      let parsedTx: ParsedTransactionWithMeta | null = null

      try {
        // Try to get parsed transaction data
        const signature = await this.connection.sendRawTransaction(serialized, {
          skipPreflight: true,
          preflightCommitment: 'processed',
        })

        const tx = await this.connection.getTransaction(signature)

        // Wait a bit and try to get the parsed transaction
        await new Promise((resolve) => setTimeout(resolve, 1000))
        parsedTx = await this.connection.getParsedTransaction(signature)
      } catch (error) {
        console.log(
          'Could not get parsed transaction, using simulation instead'
        )
      }

      // Simulate the transaction for balance changes
      const simulation = await this.simulateTransaction(transaction)

      // Analyze instructions
      await this.analyzeInstructions(transaction, effects)

      // If we have simulation results, analyze balance changes
      if (simulation?.value) {
        await this.analyzeSimulationResults(simulation.value, effects)
      }

      // If we got parsed transaction data, extract more detailed info
      if (parsedTx?.meta) {
        await this.analyzeParsedTransaction(parsedTx, effects)
      }

      // Try to detect swaps and other complex operations
      await this.detectComplexOperations(transaction, effects)
    } catch (error) {
      console.error('Error in enhanced transaction analysis:', error)
    }

    return effects
  }

  private async simulateTransaction(
    transaction: Transaction | VersionedTransaction
  ) {
    try {
      if (transaction instanceof VersionedTransaction) {
        return await this.connection.simulateTransaction(transaction, {
          sigVerify: false,
          accounts: {
            encoding: 'base64',
            addresses: transaction.message.staticAccountKeys.map((key) =>
              key.toString()
            ),
          },
        })
      } else {
        return await this.connection.simulateTransaction(transaction, [], true)
      }
    } catch (error) {
      console.error('Simulation failed:', error)
      return null
    }
  }

  private async analyzeInstructions(
    transaction: Transaction | VersionedTransaction,
    effects: EnhancedTransactionEffects
  ) {
    const instructions = this.getInstructions(transaction)

    for (const instruction of instructions) {
      const programId = instruction.programId.toString()
      const programName =
        PROGRAM_MAP[programId] || `Unknown Program: ${programId.slice(0, 8)}...`

      effects.programsInvolved.push(programId)
      effects.instructionTypes.push(programName)

      // Decode specific instruction types
      await this.decodeInstruction(instruction, programId, programName, effects)
    }
  }

  private async decodeInstruction(
    instruction: TransactionInstruction,
    programId: string,
    programName: string,
    effects: EnhancedTransactionEffects
  ) {
    try {
      if (programId === TOKEN_PROGRAM_ID.toString()) {
        await this.decodeTokenInstruction(instruction, effects)
      } else if (programId === '11111111111111111111111111111112') {
        await this.decodeSystemInstruction(instruction, effects)
      } else if (programName.includes('Jupiter')) {
        await this.decodeJupiterInstruction(instruction, effects)
      }

      effects.decodedInstructions.push({
        program: programName,
        instruction: 'Decoded instruction',
        data: { programId, accountsCount: instruction.keys.length },
      })
    } catch (error) {
      console.error('Error decoding instruction:', error)
    }
  }

  private async decodeTokenInstruction(
    instruction: TransactionInstruction,
    effects: EnhancedTransactionEffects
  ) {
    const data = instruction.data
    if (!data || data.length === 0) return

    const instructionType = data[0]

    switch (instructionType) {
      case 3: // Transfer
        if (data.length >= 9) {
          const amount = data.readBigUInt64LE(1).toString()
          const source = instruction.keys[0]?.pubkey.toString()
          const destination = instruction.keys[1]?.pubkey.toString()

          // Try to get token account info to determine mint
          try {
            const sourceAccountInfo = await this.connection.getAccountInfo(
              instruction.keys[0].pubkey
            )
            if (sourceAccountInfo) {
              const parsed = AccountLayout.decode(sourceAccountInfo.data)
              const mint = new PublicKey(parsed.mint).toString()

              effects.tokenChanges.push({
                mint,
                mintAddress: mint,
                amount,
                direction:
                  source === this.userPublicKey.toString() ? 'out' : 'in',
                fromTokenAccount: source,
                toTokenAccount: destination,
                programUsed: 'Token Program',
              })
            }
          } catch (error) {
            console.log('Could not decode token account:', error)
          }
        }
        break

      case 7: // MintTo
        effects.instructionTypes.push('Mint Tokens')
        break

      case 8: // Burn
        effects.instructionTypes.push('Burn Tokens')
        break

      case 9: // CloseAccount
        effects.accountsClosed.push(
          instruction.keys[0]?.pubkey.toString() || ''
        )
        break
    }
  }

  private async decodeSystemInstruction(
    instruction: TransactionInstruction,
    effects: EnhancedTransactionEffects
  ) {
    const data = instruction.data
    if (!data || data.length < 4) return

    const instructionType = data.readUInt32LE(0)

    switch (instructionType) {
      case 0: // CreateAccount
        effects.accountsCreated.push(
          instruction.keys[1]?.pubkey.toString() || ''
        )
        break

      case 2: // Transfer
        if (data.length >= 12) {
          const amount = data.readBigUInt64LE(4).toString()
          effects.solChanges.push({
            amount,
            direction: 'out', // Assuming user is sender
            from: instruction.keys[0]?.pubkey.toString(),
            to: instruction.keys[1]?.pubkey.toString(),
          })
        }
        break
    }
  }

  private async decodeJupiterInstruction(
    instruction: TransactionInstruction,
    effects: EnhancedTransactionEffects
  ) {
    // Jupiter instructions are complex, but we can try to extract swap info
    // from the account keys involved

    try {
      // Jupiter typically has the user's token accounts in specific positions
      const accounts = instruction.keys

      if (accounts.length >= 4) {
        // This is a simplified approach - real Jupiter decoding would need the IDL
        effects.decodedInstructions.push({
          program: 'Jupiter Aggregator',
          instruction: 'Swap',
          data: {
            accountsInvolved: accounts.length,
            potentialSwap: true,
          },
        })
      }
    } catch (error) {
      console.log('Could not decode Jupiter instruction:', error)
    }
  }

  private async analyzeSimulationResults(
    simulation: any,
    effects: EnhancedTransactionEffects
  ) {
    // Analyze pre/post token balances if available
    if (simulation.accounts) {
      const tokenProgramString = TOKEN_PROGRAM_ID.toBase58()

      effects.balanceChanges =
        simulation.accounts
          .filter((a: any) => {
            const data = Buffer.from(a.data[0], 'base64')
            return (
              a.owner === tokenProgramString && data.length === ACCOUNT_SIZE
            )
          })
          .map((a: any) => {
            const data = Buffer.from(a.data[0], 'base64')
            const decoded = AccountLayout.decode(data)
            // Convert all bigint fields to number here
            return {
              ...decoded,
              amount: Number(decoded.amount),
              delegatedAmount: Number(decoded.delegatedAmount),
              isNative: Number(decoded.isNative),
              // repeat for any other bigint fields if needed
            }
          }) || []

      for (const account of simulation.accounts) {
        if (account.owner === TOKEN_PROGRAM_ID.toString()) {
          try {
            const parsed = account.data?.parsed
            if (parsed?.info?.tokenAmount) {
              const mint = parsed.info.mint
              const amount = parsed.info.tokenAmount.amount
              const decimals = parsed.info.tokenAmount.decimals

              // Check if this is a change for our user
              const owner = parsed.info.owner
              if (owner === this.userPublicKey.toString()) {
                effects.tokenChanges.push({
                  mint: 'Token',
                  mintAddress: mint,
                  amount,
                  decimals,
                  direction: 'in', // This would need pre/post comparison
                  programUsed: 'Detected from simulation',
                })
              }
            }
          } catch (error) {
            console.log('Could not parse simulated account:', error)
          }
        }
      }
    }
  }

  private async analyzeParsedTransaction(
    parsedTx: ParsedTransactionWithMeta,
    effects: EnhancedTransactionEffects
  ) {
    if (!parsedTx.meta) return

    // Analyze token balance changes
    const preTokenBalances = parsedTx.meta.preTokenBalances || []
    const postTokenBalances = parsedTx.meta.postTokenBalances || []

    // Match pre and post balances to detect changes
    for (const postBalance of postTokenBalances) {
      const preBalance = preTokenBalances.find(
        (pre) => pre.accountIndex === postBalance.accountIndex
      )

      if (postBalance.owner === this.userPublicKey.toString()) {
        const preAmount = preBalance?.uiTokenAmount.amount || '0'
        const postAmount = postBalance.uiTokenAmount.amount || '0'

        if (preAmount !== postAmount) {
          const change = BigInt(postAmount) - BigInt(preAmount)
          const mint = postBalance.mint

          effects.tokenChanges.push({
            mint: postBalance.uiTokenAmount?.label || 'Unknown Token',
            mintAddress: mint,
            amount: Math.abs(Number(change)).toString(),
            decimals: postBalance.uiTokenAmount.decimals,
            direction: change > 0 ? 'in' : 'out',
            programUsed: 'Parsed from transaction',
          })
        }
      }
    }

    // Analyze SOL balance changes
    if (parsedTx.meta.preBalances && parsedTx.meta.postBalances) {
      const accountKeys = parsedTx.transaction.message.accountKeys

      for (let i = 0; i < accountKeys.length; i++) {
        if (
          accountKeys[i].pubkey.toString() === this.userPublicKey.toString()
        ) {
          const preBalance = parsedTx.meta.preBalances[i]
          const postBalance = parsedTx.meta.postBalances[i]
          const change = postBalance - preBalance

          if (change !== 0) {
            effects.solChanges.push({
              amount: Math.abs(change).toString(),
              direction: change > 0 ? 'in' : 'out',
            })
          }
        }
      }
    }
  }

  private async detectComplexOperations(
    transaction: Transaction | VersionedTransaction,
    effects: EnhancedTransactionEffects
  ) {
    // Detect common patterns like swaps
    const hasJupiter = effects.programsInvolved.some((p) =>
      PROGRAM_MAP[p]?.includes('Jupiter')
    )

    const hasTokenTransfers = effects.tokenChanges.length > 0

    if (hasJupiter && hasTokenTransfers) {
      // This looks like a swap
      effects.swapInfo = {
        inputToken: 'Unknown',
        outputToken: 'Unknown',
        inputAmount: '0',
        platform: 'Jupiter',
      }
    }
  }

  private getInstructions(
    transaction: Transaction | VersionedTransaction
  ): TransactionInstruction[] {
    if (transaction instanceof VersionedTransaction) {
      const message = transaction.message
      return message.compiledInstructions.map((ix) => ({
        programId: message.staticAccountKeys[ix.programIdIndex],
        keys: ix.accountKeyIndexes.map((keyIndex) => ({
          pubkey: message.staticAccountKeys[keyIndex],
          isSigner: false,
          isWritable: false,
        })),
        data: Buffer.from(ix.data),
      }))
    } else {
      return transaction.instructions
    }
  }
}
