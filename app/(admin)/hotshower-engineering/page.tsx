import { getArtworks } from "@/common/comon";
import ArtworkPage from "./ArtworkPage";

const HotshowerEngineering = async () => {
    // login, middle ware에서 해당 토큰 체크
    const artworks = await getArtworks();
    return <ArtworkPage artworks={artworks} />;
};
export default HotshowerEngineering;

