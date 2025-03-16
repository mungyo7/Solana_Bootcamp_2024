'use client'

import { PublicKey } from '@solana/web3.js'
import { useCh4CrudAppProgram, useCh4CrudAppProgramAccount } from './ch4_crud_app-data-access'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

export function Ch4CrudAppCreate() {
  const [ title, setTitle ] = useState('');
  const [ message, setMessage ] = useState('');
  const { createEntry } = useCh4CrudAppProgram();
  const { publicKey } = useWallet();

  const isFormValid = title.trim() !== '' && message.trim() !== '';

  const handleSubmit = () => {
    if (publicKey && isFormValid) {
      createEntry.mutateAsync({ title, message, signer: publicKey });
    }
  }

  if (!publicKey) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Please connect your wallet to create an account.</span>
      </div>
    )
  }
  
  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="input input-bordered w-full max-w-xs"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message"
        className="textarea textarea-bordered w-full max-w-xs"
      />
      <button
        className="btn btn-xs lg:btn-md btn-primary"
        onClick={handleSubmit}
        disabled={createEntry.isPending || !isFormValid}
      >
        Create
      </button>
    </div>
  )
}

export function Ch4CrudAppList() {
  const { accounts, getProgramAccount } = useCh4CrudAppProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <Ch4CrudAppCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  )
}

function Ch4CrudAppCard({ account }: { account: PublicKey }) {
  const { accountQuery, updateEntry, deleteEntry } = useCh4CrudAppProgramAccount({
    account,
  })

  const {publicKey} = useWallet();
  const [message, setMessage] = useState("");
  const title = accountQuery.data?.title;
  const isFormValid = message.trim() !== '';

  const handleSubmit = () => {
    if (publicKey && isFormValid && title) {
      updateEntry.mutateAsync({ title, message, signer: publicKey });
    }
  }

  if(!publicKey) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Please connect your wallet to create an account.</span>
      </div>
    )
  }

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title" onClick={() => accountQuery.refetch()}>
          {accountQuery.data?.title || 'Loading...'}</h2>
        <p>{accountQuery.data?.message}</p>
        <div className="card-actions justify-end">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="New message"
            className="input input-bordered w-full max-w-xs"
          />
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!isFormValid || updateEntry.isPending}
          >
            Update
          </button>
          <button
            className="btn btn-error"
            onClick={() => {
                if (title) {
                  deleteEntry.mutateAsync(title);
                }
              }
            }
            disabled={deleteEntry.isPending}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
