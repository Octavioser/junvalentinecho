import "../styles/global.css";
import { Inter } from "next/font/google";
import Nav from "./(navigation)/navigation";

const inter = Inter({
  subsets: ["latin"], // 필요 subset 선택 (latin, latin-ext, etc.)
  display: "swap",    // 렌더링 최적화
  weight: '300',
});

export const metadata: Metadata = {
  title: {
    template: "%s | hotShower",
    default: "Loading...."
  },
  description: 'junvalentinecho 작품들을 소개합니다.'
};

import { Metadata } from "next";
export default function RootLayout({ children }: { children: React.ReactNode; }) {

  return (
    <html lang="en" className={inter.className}>
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
