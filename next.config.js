/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        middlewareClientMaxBodySize: '50mb'
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