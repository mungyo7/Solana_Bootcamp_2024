const bs58 = require('bs58');

// JSON 파일에서 가져온 배열
const keyArray = [];

// 배열을 버퍼로 변환
const keyBuffer = Buffer.from(keyArray);

// 버퍼를 bs58로 인코딩
const bs58PrivateKey = bs58.default.encode(keyBuffer);
console.log('BS58 개인키:', bs58PrivateKey);