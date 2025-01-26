import "../styles/global.css"

export const metadata: Metadata = {
  title: {
    template: "%s | hotShower",
    default: "Loading...."
  },
  description: 'junvalentinecho 작품들을 소개합니다.'
}

import { Metadata } from "next"
import Nav from "./(navigation)/navigation"
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <div style={{ marginTop: '60px' }}></div>
        {children}
      </body>
    </html>
  )
}
