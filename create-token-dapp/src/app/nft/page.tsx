'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { Metaplex } from '@metaplex-foundation/js';
import Image from 'next/image';

interface NFTData {
  name: string;
  symbol: string;
  image: string;
  description: string;
  mint: string;
}

export default function NFTPage() {
  const { publicKey, connected } = useWallet();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState<'mainnet-beta' | 'devnet'>('devnet');

  async function fetchNFTs() {
    if (!publicKey) return;
    console.log('publicKey', publicKey);
    try {
      setLoading(true);
      const connection = new Connection(clusterApiUrl(network));
      const metaplex = new Metaplex(connection);
      
      const nftList = await metaplex
        .nfts()
        .findAllByOwner({ owner: publicKey });
        
      console.log('NFT 목록:', nftList);
      
      const nftData = await Promise.all(
        nftList.map(async (nft) => {
          try {
            if (!nft.uri) return null;
            const response = await fetch(nft.uri);
            const data = await response.json();
            
            return {
              name: data.name || '이름 없음',
              symbol: data.symbol || '',
              image: data.image || '',
              description: data.description || '설명 없음',
              mint: nft.address.toString(),
            };
          } catch (error) {
            console.error('NFT 메타데이터 가져오기 실패:', error);
            return null;
          }
        })
      );

      setNfts(nftData.filter(Boolean) as NFTData[]);
    } catch (error) {
      console.error('NFT 가져오기 오류:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (connected && publicKey) {
      fetchNFTs();
    } else {
      setNfts([]);
    }
  }, [publicKey, connected, network]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">NFT 갤러리</h1>
        <p className="text-center mb-4">NFT를 보려면 지갑을 연결하세요.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">내 NFT 갤러리</h1>
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
            onClick={() => fetchNFTs()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            새로고침
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>NFT 로딩 중...</p>
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-lg">이 지갑에 NFT가 없습니다.</p>
          <p className="text-sm text-gray-500 mt-2">또는 NFT 메타데이터를 로드할 수 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {nfts.map((nft, index) => (
            <div key={index} className="border rounded-lg overflow-hidden shadow-md transition hover:shadow-lg">
              {nft.image ? (
                <div className="relative h-48 w-full bg-gray-100">
                  {/* Use unoptimized for external images with potential issues */}
                  <Image 
                    src={nft.image} 
                    alt={nft.name} 
                    fill
                    className="object-cover"
                    unoptimized={true}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/400x400/png?text=Image+Error';
                    }}
                  />
                </div>
              ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <p>이미지 없음</p>
                </div>
              )}
              <div className="p-4">
                <h2 className="font-bold text-lg">{nft.name}</h2>
                {nft.symbol && <p className="text-sm text-gray-600">{nft.symbol}</p>}
                <p className="text-xs text-gray-500 mt-1 font-mono truncate">Mint: {nft.mint}</p>
                <p className="text-sm mt-2 line-clamp-3">{nft.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
