import "../styles/global.css";
import { Inter } from "next/font/google";
import Nav from "./(navigation)/navigation";
import GlobalPlayer from "./components/Player/GlobalPlayer";
import { getArtworks, getMusicList } from "@/common/comon";
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

  // 음악 목록을 못 받아와도 화면은 떠야 하므로, 그때는 빈 목록으로 플레이어만 비움
  const [artworks, musicList] = await Promise.all([
    getArtworks(),
    getMusicList().catch((e) => { console.error(e); return []; }),
  ]);
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        <div className="layoutRoot">
          <Nav />
          <ArtworksProvider initialArtworks={artworks}>
            <div className="childContainer">{children}</div>
          </ArtworksProvider>
          {/* 플레이어는 페이지 밖(레이아웃)에 둬야 다른 화면으로 옮겨도 노래가 이어짐 */}
          <GlobalPlayer musicList={musicList} />
        </div>
      </body>
    </html>
  );
}
