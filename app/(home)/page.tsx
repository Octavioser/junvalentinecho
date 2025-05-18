import Gallery from "./Gallery";
import { api } from "../common/comon";
import { getJsonData, updateJsonData } from "@/common/Jsonhandlers";

import fs from 'fs';
import path from 'path';

export const metadata = { title: 'Home1' }



// JSON 파일 경로 설정
const dataFilePath = path.join(process.cwd(), 'jsondata', 'movie.json');

const Home = async () => {
    // await updateJsonData(539972, "이게되넹 나이따ㅡ");
    const { ok, data, error } = await api('/api/movie');

    // await api('/api/movie')
    // const fileData = fs.readFileSync(dataFilePath, 'utf-8');
    // const data = JSON.parse(fileData);

    return <main>
        <Gallery artworks={data || []} />
    </main>
}
export default Home;
