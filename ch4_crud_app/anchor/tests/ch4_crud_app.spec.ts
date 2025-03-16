import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair } from '@solana/web3.js'
import { Ch4CrudApp } from '../target/types/ch4_crud_app'

describe('ch4_crud_app', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Ch4CrudApp as Program<Ch4CrudApp>

  const ch4_crud_appKeypair = Keypair.generate()

  it('Initialize Ch4CrudApp', async () => {
    await program.methods
      .initialize()
      .accounts({
        ch4_crud_app: ch4_crud_appKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([ch4_crud_appKeypair])
      .rpc()

    const currentCount = await program.account.ch4_crud_app.fetch(ch4_crud_appKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Ch4CrudApp', async () => {
    await program.methods.increment().accounts({ ch4_crud_app: ch4_crud_appKeypair.publicKey }).rpc()

    const currentCount = await program.account.ch4_crud_app.fetch(ch4_crud_appKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Ch4CrudApp Again', async () => {
    await program.methods.increment().accounts({ ch4_crud_app: ch4_crud_appKeypair.publicKey }).rpc()

    const currentCount = await program.account.ch4_crud_app.fetch(ch4_crud_appKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Ch4CrudApp', async () => {
    await program.methods.decrement().accounts({ ch4_crud_app: ch4_crud_appKeypair.publicKey }).rpc()

    const currentCount = await program.account.ch4_crud_app.fetch(ch4_crud_appKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set ch4_crud_app value', async () => {
    await program.methods.set(42).accounts({ ch4_crud_app: ch4_crud_appKeypair.publicKey }).rpc()

    const currentCount = await program.account.ch4_crud_app.fetch(ch4_crud_appKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the ch4_crud_app account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        ch4_crud_app: ch4_crud_appKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.ch4_crud_app.fetchNullable(ch4_crud_appKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
