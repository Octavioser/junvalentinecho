"use client";
import { usePathname } from "next/navigation";
import { MusicBlob } from "@/types";
import Player from "./Player";

// 전체 레이아웃에 한 번만 두는 플레이어: 페이지를 옮겨도 그대로 남아 있어서 노래가 끊기지 않음 (관리자 화면에서는 숨김)
const GlobalPlayer = ({ musicList }: { musicList: MusicBlob[]; }) => {
    const path = usePathname();
    if (path.includes('hotshower-engineering')) return null;
    return <Player musicList={musicList} />;
};
export default GlobalPlayer;
