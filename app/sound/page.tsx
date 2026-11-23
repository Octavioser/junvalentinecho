import { Metadata } from "next";
import NotFound from "../not-found";

export const metadata: Metadata = {
    title: 'SOUND',
    robots: { index: false }, // 내용이 없는 화면이라 검색에는 잡히지 않게
};

// SOUND 메뉴: 아직 내용이 없어서 "페이지를 찾을 수 없음" 화면을 그대로 보여 줌.
// 없는 주소로 보내지 않고 실제 페이지로 둔 이유: 없는 주소로 가면 화면 전체를 새로 받아서 플레이어의 노래가 끊김
const Sound = () => <NotFound />;

export default Sound;
