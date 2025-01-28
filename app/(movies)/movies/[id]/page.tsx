import { Suspense } from "react";
import { API_URL } from "../../../constants";
import MovieInfo, { getMovies } from "./movie-info";
import MovieVideos from "./movie-videos";

// metadata 는 이름이 generateMetadata(동적) metadata(정적)이어야하며
// ssr이어야한다.
export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { title } = await getMovies(id);
    return { title }
}

const MovieDetail = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return <div>
        <Suspense fallback={<img src="/images/loading.gif" alt="loading" />}>
            <MovieInfo id={id} />
        </Suspense>
        <Suspense fallback={<h1></h1>}>
            <MovieVideos id={id} />
        </Suspense>
    </div>
}
export default MovieDetail;