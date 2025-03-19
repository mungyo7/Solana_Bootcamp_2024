'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { Metaplex } from '@metaplex-foundation/js';
import Image from 'next/image';

interface SPL20TokenData {
  name: string;
  symbol: string;
  image: string;
  description: string;
  mint: string;
  amount: number;
  decimals: number;
  formattedAmount: string;
}

// IPFS URL을 HTTP URL로 변환하는 헬퍼 함수
function convertIpfsUrl(url: string): string {
  if (!url) return '';
  
  // ipfs:// 형식의 URL을 https://ipfs.io/ipfs/ 형식으로 변환
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  
  // ar:// 형식의 URL을 https://arweave.net/ 형식으로 변환
  if (url.startsWith('ar://')) {
    return url.replace('ar://', 'https://arweave.net/');
  }
  
  return url;
}

export default function SPL20TokenPage() {
  const { publicKey, connected } = useWallet();
  const [tokens, setTokens] = useState<SPL20TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState<'mainnet-beta' | 'devnet'>('devnet');

  async function fetchTokens() {
    if (!publicKey) return;
    try {
      setLoading(true);
      const connection = new Connection(clusterApiUrl(network));
      const metaplex = new Metaplex(connection);
      
      // 1. 사용자의 토큰 계정 가져오기
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );
      
      console.log('Token Accounts:', tokenAccounts.value);
      
      // 토큰 데이터 가져오기
      const tokenDataPromises = tokenAccounts.value.map(async (tokenAccount) => {
        try {
          const parsedAccountInfo = tokenAccount.account.data.parsed.info;
          const mintAddress = new PublicKey(parsedAccountInfo.mint);
          const amount = Number(parsedAccountInfo.tokenAmount.amount);
          const decimals = parsedAccountInfo.tokenAmount.decimals;
          
          // 잔액이 0인 토큰 건너뛰기
          if (amount === 0) return null;
          
          // 토큰 메타데이터 가져오기
          try {
            const tokenMetadata = await metaplex.nfts().findByMint({ mintAddress });
            
            // 토큰 정보 기본값 설정
            let image = '';
            let description = '';
            let name = tokenMetadata.name || '이름 없음';
            let symbol = tokenMetadata.symbol || '';
            
            // URI에서 토큰 메타데이터 가져오기
            if (tokenMetadata.uri) {
              try {
                // CORS 오류를 방지하기 위한 프록시 API 사용
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(tokenMetadata.uri)}`;
                
                const response = await fetch(proxyUrl, {
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                  },
                  // 타임아웃 설정 (브라우저 기본값인 300초 대신 짧게 설정)
                  signal: AbortSignal.timeout(15000), // 15초 타임아웃
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // IPFS URL 처리 및 변환
                image = convertIpfsUrl(data.image) || '';
                description = data.description || '설명 없음';
                // URI에 이름 정보가 있다면 업데이트
                name = data.name || name;
                symbol = data.symbol || symbol;
              } catch (error) {
                console.error('토큰 메타데이터 가져오기 오류:', error);
                // 에러 발생 시 기본 값 유지
              }
            }
            
            // 표시 금액 계산 (소수점 적용)
            const formattedAmount = (amount / Math.pow(10, decimals)).toLocaleString();
            
            return {
              name,
              symbol,
              image,
              description,
              mint: mintAddress.toString(),
              amount,
              decimals,
              formattedAmount
            };
          } catch (error) {
            console.error('토큰 메타데이터 가져오기 오류:', mintAddress.toString(), error);
            // 메타데이터가 없는 토큰의 경우
            return {
              name: `알 수 없는 토큰`,
              symbol: '???',
              image: '',
              description: '토큰 메타데이터를 찾을 수 없습니다',
              mint: mintAddress.toString(),
              amount,
              decimals,
              formattedAmount: (amount / Math.pow(10, decimals)).toLocaleString()
            };
          }
        } catch (error) {
          console.error('토큰 처리 오류:', error);
          return null;
        }
      });
      
      // 모든 Promise 결과 기다리기
      const tokenData = await Promise.all(tokenDataPromises);
      
      // null 값 필터링
      setTokens(tokenData.filter(Boolean) as SPL20TokenData[]);
    } catch (error) {
      console.error('토큰 목록 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (connected && publicKey) {
      fetchTokens();
    } else {
      setTokens([]);
    }
  }, [publicKey, connected, network]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">SPL20 토큰 목록</h1>
        <p className="text-center mb-4">지갑에 연결해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">내 SPL20 토큰 목록</h1>
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <p>지갑 주소: <span className="font-mono">{publicKey?.toString()}</span></p>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="devnet"
              checked={network === 'devnet'}
              onChange={() => setNetwork('devnet')}
              className="mr-2"
            />
            Devnet
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="mainnet-beta"
              checked={network === 'mainnet-beta'}
              onChange={() => setNetwork('mainnet-beta')}
              className="mr-2"
            />
            Mainnet
          </label>
          <button
            onClick={() => fetchTokens()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            새로고침
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>토큰 로딩 중...</p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-lg">보유한 SPL20 토큰이 없습니다.</p>
          <p className="text-sm text-gray-500 mt-2">또는 토큰 메타데이터를 불러올 수 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tokens.map((token, index) => (
            <div key={index} className="border rounded-lg overflow-hidden shadow-md transition hover:shadow-lg">
              {token.image ? (
                <div className="relative h-48 w-full bg-gray-100">
                  <Image 
                    src={token.image ? `/api/proxy?url=${encodeURIComponent(token.image)}` : 'https://placehold.co/400x400/png?text=No+Image'
                    } 
                    alt={token.name} 
                    fill
                    className="object-cover"
                    unoptimized={true}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/400x400/png?text=Token+Image+Error';
                    }}
                  />
                </div>
              ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500">이미지 없음</p>
                    <p className="text-2xl font-bold mt-2">{token.symbol}</p>
                  </div>
                </div>
              )}
              <div className="p-4">
                <h2 className="font-bold text-lg">{token.name}</h2>
                {token.symbol && <p className="text-sm text-gray-600">{token.symbol}</p>}
                
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <p className="text-lg font-bold text-blue-800">{token.formattedAmount} {token.symbol}</p>
                </div>
                
                <p className="text-xs text-gray-500 mt-1 font-mono truncate">Mint: {token.mint}</p>
                <p className="text-sm mt-2 line-clamp-3">{token.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}