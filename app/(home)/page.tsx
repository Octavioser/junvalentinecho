import Movie from "./movie"
import styles from "./home.module.css"
import { api } from "../common/comon";
import { getJsonData, updateJsonData } from "../../jsondata/jsonhandlers";

import fs from 'fs';
import path from 'path';

export const metadata = { title: 'Home1' }



// JSON 파일 경로 설정
const dataFilePath = path.join(process.cwd(), 'jsondata', 'movie.json');

const Home = async () => {
    // await updateJsonData(539972, "이게되넹 나이따ㅡ");
    // const { ok, data: movie, error } = await api('/api/movie');

    // await api('/api/movie')
    const fileData = fs.readFileSync(dataFilePath, 'utf-8');
    const movie = JSON.parse(fileData);

    return <main className={styles.mainContent}>
        <Movie movie={movie || []} />
    </main>
}
export default Home;
