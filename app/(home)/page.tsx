import Gallery from "./Gallery";
import { getMusicList } from "@/common/comon";
export const metadata = { title: 'Home' };

const Home = async () => {
    const musicList = await getMusicList();
    return <Gallery musicList={musicList} />;
};
export default Home;
