'use client'

import { getCreatetokendappProgram, getCreatetokendappProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useCreatetokendappProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getCreatetokendappProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getCreatetokendappProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['createtokendapp', 'all', { cluster }],
    queryFn: () => program.account.createtokendapp.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['createtokendapp', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ createtokendapp: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useCreatetokendappProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useCreatetokendappProgram()

  const accountQuery = useQuery({
    queryKey: ['createtokendapp', 'fetch', { cluster, account }],
    queryFn: () => program.account.createtokendapp.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['createtokendapp', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ createtokendapp: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['createtokendapp', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ createtokendapp: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['createtokendapp', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ createtokendapp: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['createtokendapp', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ createtokendapp: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
