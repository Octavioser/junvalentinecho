import "../styles/global.css";
import { Inter } from "next/font/google";
import Nav from "./(navigation)/navigation";
import { getArtworks } from "@/common/comon";
import { ArtworksProvider } from './providers/ArtworksProvider';

const inter = Inter({
  subsets: ["latin"], // 필요 subset 선택 (latin, latin-ext, etc.)
  display: "swap",    // 렌더링 최적화
  weight: '300',
});

export const metadata: Metadata = {
  title: {
    template: "%s | Joonhyeok Daniel Cho",
    default: "Loading...."
  },
  description: 'junvalentinecho 작품들을 소개합니다.'
};

import { Metadata } from "next";
export default async function RootLayout({ children }: { children: React.ReactNode; }) {

  const artworks = await getArtworks();
  return (
    <html lang="en" className={inter.className}>
      <body>
        <div className="layoutRoot">
          <Nav />
          <ArtworksProvider initialArtworks={artworks}>
            <div className="childContainer">{children}</div>
          </ArtworksProvider>
        </div>
      </body>
    </html>
  );
}
