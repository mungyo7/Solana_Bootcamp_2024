'use client'

import { getCh4CrudAppProgram, getCh4CrudAppProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

interface CreateEntryArgs {
  title: string;
  message: string;
  signer: PublicKey;
}

export function useCh4CrudAppProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getCh4CrudAppProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getCh4CrudAppProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['ch4_crud_app', 'all', { cluster }],
    queryFn: () => program.account.journalEntryState.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: ['journalEntry', 'create', { cluster }],
    mutationFn: async ({ title, message, signer }) => {
      return program.methods.createJournalEntry(title, message).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      accounts.refetch();
    },
    onError: (error) => toast.error(`Error creating entry: ${error.message}`),
  });

  return {
    program,
    accounts,
    getProgramAccount,
    createEntry,
    programId,
  }
}

export function useCh4CrudAppProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useCh4CrudAppProgram()

  const accountQuery = useQuery({
    queryKey: ['ch4_crud_app', 'fetch', { cluster, account }],
    queryFn: () => program.account.journalEntryState.fetch(account),
  })

  const updateEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: ['journalEntry', 'update', { cluster }],
    mutationFn: async ({ title, message }) => {
      return program.methods.updateJournalEntry(title, message).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      accounts.refetch();
    },
    onError: (error) => toast.error(`Error updating entry: ${error.message}`),
  });

  const deleteEntry = useMutation<string, Error, string>({
    mutationKey: ['journalEntry', 'delete', { cluster }],
    mutationFn: (title: string) => {
      return program.methods.deleteJournalEntry(title).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      accounts.refetch();
    },
    onError: (error) => toast.error(`Error deleting entry: ${error.message}`),
  });

  return {
    accountQuery,
    updateEntry,
    deleteEntry,
  }
}

