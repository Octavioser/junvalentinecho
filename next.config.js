/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        middlewareClientMaxBodySize: '50mb'
    },
    images: {
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