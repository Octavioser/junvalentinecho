import Movie from "./movie"
import styles from "./home.module.css"
import { api } from "../common/comon";
import { getJsonData, updateJsonData } from "../../jsondata/jsonhandlers";

export const metadata = { title: 'Home1' }

const Home = async () => {
    // await updateJsonData(539972, "이게되넹 나이따ㅡ");
    const { ok, data: movie, error } = await api('/api/movie');

    return <main className={styles.mainContent}>
        <Movie movie={movie || []} />
    </main>
}
export default Home;
