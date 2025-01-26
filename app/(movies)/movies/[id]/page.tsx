import { Suspense } from "react";
import { API_URL } from "../../../constants";
import MovieInfo, { getMovies } from "./movie-info";
import MovieVideos from "./movie-videos";

interface Iparams {
    params: Promise<{ id: string }>
}

// metadata 는 이름이 generateMetadata(동적) metadata(정적)이어야하며
// ssr이어야한다.
export async function generateMetadata({ params }: Iparams) {
    const { id } = await params;
    const { title } = await getMovies(id);
    return { title }
}

export default async function MovieDetail({ params }: Iparams) {
    const { id } = await params;
    return <div>
        <Suspense fallback={<h1>Loading movie info</h1>}>
            <MovieInfo id={id} />
        </Suspense>
        <Suspense fallback={<h1></h1>}>
            <MovieVideos id={id} />
        </Suspense>
    </div>
}