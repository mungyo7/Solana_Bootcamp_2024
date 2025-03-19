'use client';

import { FC, useState, useRef, ChangeEvent } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { 
  percentAmount, 
  generateSigner, 
  signerIdentity, 
  createSignerFromKeypair,
  Keypair
} from '@metaplex-foundation/umi';
import { 
  TokenStandard, 
  createAndMint, 
  mplTokenMetadata 
} from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import Image from 'next/image';
import foodImage from './food0.png';

// Pinata JWT 직접 사용 (실제 환경에서는 환경 변수로 관리하는 것이 안전합니다)
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
console.log('환경 변수 확인:', {
  PINATA_JWT: process.env.NEXT_PUBLIC_PINATA_JWT,
  모든환경변수: process.env.NEXT_PUBLIC_
});

interface UploadResponse {
  IpfsHash?: string;
  PinSize?: number;
  Timestamp?: string;
  isDuplicate?: boolean;
  error?: string;
  data?: {
    IpfsHash?: string;
    PinSize?: number;
    Timestamp?: string;
    cid?: string;
    size?: number;
    name?: string;
  };
}

const CreateToken: FC = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [decimals, setDecimals] = useState('8');
  const [amount, setAmount] = useState('1000000');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tokenResult, setTokenResult] = useState<{mintAddress: string, imageUrl: string, metadataUrl: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [useDefaultImage, setUseDefaultImage] = useState(false);
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setUseDefaultImage(false);
      
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const useDefaultImageHandler = () => {
    setUseDefaultImage(true);
    setImagePreview('/food0.png');
    
    // 이미지 파일로 변환
    fetch('/food0.png')
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "food0.png", { type: "image/png" });
        setImageFile(file);
      })
      .catch(err => {
        console.error("기본 이미지 로드 실패:", err);
        setStatus("기본 이미지 로드에 실패했습니다.");
      });
  };

  const uploadImageToPinata = async (file: File): Promise<string> => {
    setStatus('이미지를 IPFS에 업로드 중...');
    console.log('환경 변수 확인:', {
      PINATA_JWT: process.env.NEXT_PUBLIC_PINATA_JWT,
      모든환경변수: process.env.NEXT_PUBLIC_
    });
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pinataMetadata', JSON.stringify({
        name: `${tokenSymbol}_image`
      }));
      
      // Pinata 파일 업로드 API
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Pinata API 오류: ${response.statusText}`);
      }
      
      const data: UploadResponse = await response.json();
      
      if (data.IpfsHash) {
        return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
      } else {
        throw new Error('IPFS 해시를 받지 못했습니다');
      }
    } catch (error: any) {
      console.error('이미지 업로드 오류:', error);
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }
  };

  const uploadMetadataToPinata = async (imageUrl: string): Promise<string> => {
    setStatus('메타데이터를 IPFS에 업로드 중...');
    
    try {
      // 메타데이터 객체 생성
      const metadata = {
        name: tokenName,
        symbol: tokenSymbol,
        description: `${tokenName} 토큰`,
        image: imageUrl,
        attributes: [],
      };
      
      // Pinata JSON 업로드 API
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `${tokenSymbol}_metadata.json`
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Pinata API 오류: ${response.statusText}`);
      }
      
      const data: UploadResponse = await response.json();
      
      if (data.IpfsHash) {
        return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
      } else {
        throw new Error('메타데이터 IPFS 해시를 받지 못했습니다');
      }
    } catch (error: any) {
      console.error('메타데이터 업로드 오류:', error);
      throw new Error(`메타데이터 업로드 실패: ${error.message}`);
    }
  };

  const handleCreateToken = async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) {
      setStatus('지갑을 연결해주세요');
      return;
    }
    
    if (!imageFile && !useDefaultImage) {
      setStatus('토큰 이미지를 선택하거나 기본 이미지를 사용해주세요');
      return;
    }
    
    if (!tokenName || !tokenSymbol) {
      setStatus('토큰 이름과 심볼을 입력해주세요');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // 이미지 IPFS에 업로드
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadImageToPinata(imageFile);
      }
      
      // 메타데이터 JSON 생성 및 업로드
      const metadataUri = await uploadMetadataToPinata(imageUrl);
      console.log('메타데이터 URI:', metadataUri);
      setStatus('토큰 생성 준비 중...');
      
      // UMI 인스턴스 생성
      const umi = createUmi(connection.rpcEndpoint);
      
      // walletAdapterIdentity 사용하여 지갑 어댑터 연결
      const wallet = {
        publicKey: publicKey, 
        signTransaction, 
        signAllTransactions
      };
      umi.use(walletAdapterIdentity(wallet));
      
      // 민트 생성자 생성
      const mint = generateSigner(umi);
      
      setStatus('토큰 생성 및 발행 중...');
      umi.use(mplTokenMetadata());
      
      // createAndMint 호출
      await createAndMint(umi, {
        mint,
        authority: umi.identity,
        name: tokenName,
        symbol: tokenSymbol,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(0),
        decimals: Number(decimals),
        amount: BigInt(Number(amount) * (10 ** Number(decimals))),
        tokenOwner: publicKey as any,
        tokenStandard: TokenStandard.Fungible,
      }).sendAndConfirm(umi);
      
      // 결과 저장
      setTokenResult({
        mintAddress: mint.publicKey.toString(),
        imageUrl,
        metadataUrl: metadataUri
      });
      
      setStatus(`토큰이 성공적으로 생성되었습니다!`);
    } catch (error: any) {
      console.error("Error details:", error);
      setStatus(`오류 발생: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">새로운 SPL 토큰 생성</h1>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">토큰 이름</label>
              <input
                type="text"
                placeholder="예: My Awesome Token"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">토큰 심볼</label>
              <input
                type="text"
                placeholder="예: MAT"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">소수점 자리수</label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  placeholder="8"
                  value={decimals}
                  onChange={(e) => setDecimals(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">초기 발행량</label>
                <input
                  type="number"
                  min="1"
                  placeholder="1000000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">토큰 이미지</label>
              <div className="flex space-x-2 mb-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                >
                  이미지 업로드
                </button>
                <button
                  type="button"
                  onClick={useDefaultImageHandler}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                >
                  기본 이미지 사용
                </button>
              </div>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                className="hidden"
              />
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center">
                {imagePreview ? (
                  <div className="relative w-full h-32 mb-2">
                    <img 
                      src={imagePreview} 
                      alt="토큰 이미지 미리보기" 
                      className="max-h-32 max-w-full mx-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-1">이미지가 선택되지 않았습니다</p>
                    <p className="text-xs text-gray-400">이미지를 업로드하거나 기본 이미지를 사용하세요</p>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={handleCreateToken}
              disabled={isLoading}
              className={`w-full p-3 rounded font-medium transition ${
                isLoading 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isLoading ? '생성 중...' : '토큰 생성하기'}
            </button>
          </div>
        </div>

        {status && (
          <div className={`p-4 rounded-lg mb-6 ${
            status.includes('오류') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}>
            <p>{status}</p>
          </div>
        )}
        
        {tokenResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-lg font-medium text-green-800 mb-2">토큰 생성 완료!</h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">민트 주소:</p>
                <p className="font-mono text-xs bg-white p-2 rounded border break-all">
                  {tokenResult.mintAddress}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">이미지 URL:</p>
                <p className="font-mono text-xs bg-white p-2 rounded border break-all">
                  {tokenResult.imageUrl}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">메타데이터 URL:</p>
                <p className="font-mono text-xs bg-white p-2 rounded border break-all">
                  {tokenResult.metadataUrl}
                </p>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-gray-500">
                  토큰을 Solana Explorer에서 확인하려면 
                  <a 
                    href={`https://explorer.solana.com/address/${tokenResult.mintAddress}?cluster=devnet`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    여기를 클릭하세요
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateToken; 