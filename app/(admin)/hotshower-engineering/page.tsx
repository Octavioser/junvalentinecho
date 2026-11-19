import { getArtworksFresh, getMusicListFresh } from "@/common/comon";
import ArtworkPage from "./ArtworkPage";

const HotshowerEngineering = async () => {
    // login, middle ware에서 해당 토큰 체크
    // 관리자는 받은 목록 전체를 고쳐서 다시 저장하므로, 캐시된(오래됐을 수 있는) 목록이 아니라 저장소의 최신 목록을 씀
    const artworks = await getArtworksFresh();
    const musicList = await getMusicListFresh();
    return <ArtworkPage artworks={artworks} musicList={musicList} />;
};
export default HotshowerEngineering;

