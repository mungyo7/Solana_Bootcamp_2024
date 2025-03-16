// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import Ch4CrudAppIDL from '../target/idl/ch4_crud_app.json'
import type { Ch4CrudApp } from '../target/types/ch4_crud_app'

// Re-export the generated IDL and type
export { Ch4CrudApp, Ch4CrudAppIDL }

// The programId is imported from the program IDL.
export const CH4_CRUD_APP_PROGRAM_ID = new PublicKey(Ch4CrudAppIDL.address)

// This is a helper function to get the Ch4CrudApp Anchor program.
export function getCh4CrudAppProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...Ch4CrudAppIDL, address: address ? address.toBase58() : Ch4CrudAppIDL.address } as Ch4CrudApp, provider)
}

// This is a helper function to get the program ID for the Ch4CrudApp program depending on the cluster.
export function getCh4CrudAppProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Ch4CrudApp program on devnet and testnet.
      return new PublicKey('FX6obMKSmgdg5FygYaVqsytTfswENphFiPJ9v5NsFa1B')
    case 'mainnet-beta':
    default:
      return CH4_CRUD_APP_PROGRAM_ID
  }
}
