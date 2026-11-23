/** @type {import('next').NextConfig} */
const nextConfig = {
    // 개발 서버(로컬)에만 쓰이는 설정: 같은 공유기에 물린 휴대폰 등에서 http://192.168.x.x:3000 으로 접속해 볼 수 있게 허용.
    // 없으면 Next가 그 기기의 개발용 연결(/_next/hmr)을 막는데, 그때 vercel dev가 오류를 내며 꺼짐. 실제 사이트에는 영향 없음
    allowedDevOrigins: ['192.168.*.*'],
    experimental: {
        proxyClientMaxBodySize: '50mb'
    },
    images: {
        // 쓸 수 있는 압축 품질: 75(기본), 90(작품 표시용, app/common/image.ts의 ARTWORK_QUALITY)
        qualities: [75, 90],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'uwkvvru2scgcmnbh.public.blob.vercel-storage.com',
                port: '',
            },
        ],
    },
};

module.exports = nextConfig;