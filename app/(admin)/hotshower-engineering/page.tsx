import { getArtworks, getMusicList } from "@/common/comon";
import ArtworkPage from "./ArtworkPage";

const HotshowerEngineering = async () => {
    // login, middle ware에서 해당 토큰 체크
    const artworks = await getArtworks();
    const musicList = await getMusicList();
    return <ArtworkPage artworks={artworks} musicList={musicList} />;
};
export default HotshowerEngineering;

