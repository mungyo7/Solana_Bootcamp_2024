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
      setTitle('');
      setMessage('');
    }
  }

  if (!publicKey) {
    return (
      <div className="alert alert-info bg-blue-50 border-blue-200 text-blue-700 rounded-lg shadow-md p-4 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">지갑을 연결해주세요.</span>
      </div>
    )
  }
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-all hover:shadow-xl">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">새 항목 생성</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="input input-bordered w-full bg-gray-50 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">메시지</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="textarea textarea-bordered w-full h-24 bg-gray-50 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <button
          className="btn btn-primary w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          onClick={handleSubmit}
          disabled={createEntry.isPending || !isFormValid}
        >
          {createEntry.isPending ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              생성 중...
            </span>
          ) : "생성하기"}
        </button>
      </div>
    </div>
  )
}

export function Ch4CrudAppList() {
  const { accounts, getProgramAccount } = useCh4CrudAppProgram()

  if (getProgramAccount.isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert bg-amber-50 border-amber-200 text-amber-700 rounded-lg shadow-md p-4 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="font-medium">프로그램 계정을 찾을 수 없습니다. 프로그램이 배포되었고 올바른 클러스터에 있는지 확인하세요.</span>
      </div>
    )
  }
  return (
    <div className="space-y-8 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">모든 항목</h2>
      {accounts.isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-6">
          {accounts.data?.map((account) => (
            <Ch4CrudAppCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-gray-50 p-10 rounded-xl border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">항목이 없습니다</h2>
          <p className="text-gray-500">위에서 새 항목을 생성해보세요.</p>
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
      <div className="alert bg-blue-50 border-blue-200 text-blue-700 rounded-lg shadow-md p-4 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">지갑을 연결해주세요.</span>
      </div>
    )
  }

  return accountQuery.isLoading ? (
    <div className="h-48 flex justify-center items-center p-8 bg-white rounded-xl shadow-md">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ) : (
    <div className="card bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
      <div className="card-body p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="card-title text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => accountQuery.refetch()}>
            {accountQuery.data?.title || '로딩 중...'}
          </h2>
          <div className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-semibold">
            항목 #{account.toString().substring(0, 4)}
          </div>
        </div>
        <p className="text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">{accountQuery.data?.message}</p>
        <div className="card-actions space-y-3">
          <div className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="새 메시지 입력"
              className="input input-bordered w-full bg-gray-50 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 btn bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all"
              onClick={handleSubmit}
              disabled={!isFormValid || updateEntry.isPending}
            >
              {updateEntry.isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  업데이트 중...
                </span>
              ) : "업데이트"}
            </button>
            <button
              className="btn bg-white border border-red-500 text-red-500 hover:bg-red-50 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
              onClick={() => {
                  if (title) {
                    deleteEntry.mutateAsync(title);
                  }
                }
              }
              disabled={deleteEntry.isPending}
            >
              {deleteEntry.isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : "삭제"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
