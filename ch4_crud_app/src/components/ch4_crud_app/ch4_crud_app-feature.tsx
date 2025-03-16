'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero, ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useCh4CrudAppProgram } from './ch4_crud_app-data-access'
import { Ch4CrudAppCreate, Ch4CrudAppList } from './ch4_crud_app-ui'

export default function Ch4CrudAppFeature() {
  const { publicKey } = useWallet()
  const { programId } = useCh4CrudAppProgram()

  return publicKey ? (
    <div>
      <AppHero
        title="Ch4CrudApp"
        subtitle={
          'Create a new account by clicking the "Create" button. The state of a account is stored on-chain and can be manipulated by calling the program\'s methods (increment, decrement, set, and close).'
        }
      >
        <p className="mb-6">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
        <Ch4CrudAppCreate />
      </AppHero>
      <Ch4CrudAppList />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}
