'use server';
import { Artwork, MusicBlob } from "@/types";
import { put, del, head, list } from '@vercel/blob';
import { revalidateTag, unstable_cache, unstable_noStore } from 'next/cache';
import { assertAdmin } from './adminAuth';
// export const api = async (apiUrl: string) => {
//     try {
//         const fetchdata = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/${apiUrl}`, {
//             method: 'POST', // POST 요청
//             headers: {
//                 'Content-Type': 'application/json', // 요청 타입
//             },
//         });
//         // fetch 실패시 에러 처리
//         if (!fetchdata.ok) throw new Error(`HTTP Error: ${fetchdata.status}`);
//         // json 형태 변환시 에러 처리
//         return await (async () => {
//             try {
//                 return { ok: true, data: await fetchdata.json(), error: null, };
//             }
//             catch (error: any) {
//                 throw new Error(`json() Error status: ${fetchdata.status}`);
//             }
//         })();
//     } catch (error: any) {
//         console.log(error);
//         return {
//             ok: false,
//             data: null,
//             error: error.message || 'error',
//         };
//     }
// };

// 아래 저장·삭제 함수는 모두 관리자 로그인을 먼저 확인 (읽기 함수는 공개 페이지에서도 씀)
// 그림 파일 올리기는 브라우저에서 저장소로 바로 올림 (app/api/image/upload-token, 서버를 거치면 큰 파일을 못 받음)

// 이미지 삭제
export const delImage = async (url: string) => {
    await assertAdmin();
    try {
        if (!url) throw new Error("URL is required");
        await del(url);
    } catch {
        // ignore
    }
};



/**
 * ✅ 캐시 때문에 버전 파일을 쓰는 이유
 * - Vercel Blob의 공개 URL은 CDN/브라우저에 캐시됩니다.
 * - "같은 URL을 덮어쓰기"만 하면 캐시가 갱신되기까지 잠시(최소 수십 초) 이전 내용이 보일 수 있습니다.
 * - 그래서 매 저장마다 "파일명(=URL)을 새로" 만들어 캐시 키 자체를 바꿉니다.
 *   -> `${BASENAME}-${Date.now()}.json` 처럼 불변(immutable) URL을 생성하면, 항상 "즉시 최신"을 받게 됩니다.
 * - 읽을 때는 "가장 최근 버전의 URL"을 찾아 그걸 fetch 합니다.
 *
 * 🔐 서버 전용 API 주의
 * - `list/put/del`은 RW 토큰이 필요한 서버 전용입니다(라우트 핸들러/서버 액션/서버 컴포넌트 등에서만 사용).
 * - 클라이언트에서 직접 호출하지 마세요.
 */

const JSON_BASENAME = "artwork";
const JSON_PREFIX = "data/";

/**
 * ✅ 목록 조회를 캐시하는 이유
 * - 저장소의 `list()`와 `put()`은 "Advanced Operation"으로 세고, 무료 플랜은 30일에 2,000번까지입니다.
 *   넘으면 저장소 전체가 막혀서 사진·그림 목록이 모두 안 나옵니다.
 * - 그래서 공개 화면은 `list()` 결과를 서버에 캐시해 두고, 관리자가 저장·업로드·삭제할 때만 새로 조회합니다.
 * - 관리자 화면은 캐시를 거치지 않고 항상 저장소에서 바로 읽습니다 (오래된 목록으로 저장하면 최신 내용을 덮어쓰므로).
 */
const ARTWORKS_TAG = "artworks";
const MUSIC_TAG = "music";

// 안전망: 저장소를 이 서버 밖에서 고쳤을 때(로컬에서 저장한 내용을 실제 사이트가 볼 때, Vercel 화면에서 직접 고쳤을 때)는
// 캐시를 새로 고칠 방법이 없으므로, 이 시간이 지나면 한 번 다시 조회함
const LIST_MAX_AGE = 12 * 60 * 60; // 초 (12시간)

// 가장 최근 그림 목록 파일의 주소 (저장소 목록 조회 1번)
const findArtworkJsonUrl = async (): Promise<string | null> => {
    // 해당 경로 파일들 가져오기 
    const { blobs } = await list({ prefix: JSON_PREFIX });
    // json만 
    const jsons = blobs.filter(b => b.pathname.endsWith(".json"));
    if (jsons.length === 0) return null;
    // 최신순으로
    jsons.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    return jsons[0].url;
};

// 그림 목록 파일 내용. 못 읽으면 던짐 (빈 목록을 돌려주면 그게 캐시에 남거나, 관리자가 빈 목록으로 저장하게 됨)
const fetchArtworkJson = async (url: string): Promise<Artwork[]> => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`그림 목록 파일을 읽지 못했습니다 (${res.status})`);
    return await res.json();
};

const cachedArtworkJsonUrl = unstable_cache(findArtworkJsonUrl, ["artwork-json-url"], { tags: [ARTWORKS_TAG], revalidate: LIST_MAX_AGE });
// 파일 주소는 저장할 때마다 새로 생기고 한 번 만든 파일은 내용이 바뀌지 않으므로, 읽은 내용은 주소별로 계속 캐시
const cachedArtworkJson = unstable_cache(fetchArtworkJson, ["artwork-json"]);

export const writeList = async (artworkList: Artwork[]) => {
    await assertAdmin();
    // 1) 새 버전 업로드 (URL 바뀌므로 즉시 최신 보장)
    const ver = Date.now();
    const targetPath = `${JSON_PREFIX}${JSON_BASENAME}-${ver}.json`;
    // 데이터 넣기 
    const { pathname: newPath } = await put(targetPath, JSON.stringify(artworkList), {
        access: "public",
        contentType: "application/json",
    });
    // 공개 화면이 새 목록 파일을 찾도록 캐시를 비움
    revalidateTag(ARTWORKS_TAG);

    // 방금 올린 것을 제외하고 이전 것들은 나머지를 지워야 함
    const { blobs } = await list({ prefix: JSON_PREFIX });
    const oldJsons = blobs.filter(b => b.pathname.endsWith(".json") && b.pathname !== newPath);

    oldJsons.length && await del(oldJsons.map(b => b.pathname));
};


// 이미지 정보 데이터 가져오기 (공개 화면용: 저장소 조회를 캐시)
export const getArtworks = async (): Promise<Artwork[]> => {
    unstable_noStore(); // 화면은 요청마다 새로 그림 (캐시하는 건 저장소 조회 결과뿐)
    const url = await cachedArtworkJsonUrl();
    if (!url) return [];
    // 파일을 못 읽어도(저장소 장애 등) 화면은 떠야 하므로 빈 전시장으로 보여 줌. 실패한 결과는 캐시에 남지 않아 다음 요청에 다시 읽음
    return await cachedArtworkJson(url).catch((e) => { console.error(String(e)); return []; });
};

// 이미지 정보 데이터 가져오기 (관리자 화면용: 캐시 없이 저장소에서 바로)
export const getArtworksFresh = async (): Promise<Artwork[]> => {
    await assertAdmin();
    const url = await findArtworkJsonUrl();
    return url ? await fetchArtworkJson(url) : [];
};

// 이미지 정보 추가하기
export const addArtwork = async (artwork: Artwork[], targetArtWork: Artwork): Promise<void> => {
    await assertAdmin();
    await writeList([...artwork, targetArtWork]);
};

// 이미지 정보 수정하기
export const updateArtwork = async (artwork: Artwork[], targetArtWork: Artwork): Promise<void> => {
    await assertAdmin();
    await writeList(artwork.map((item) => (item.id === targetArtWork.id ? targetArtWork : item)));
};

// 이미지 전체 정보 수정하기
export const updateAllArtwork = async (artwork: Artwork[]): Promise<void> => {
    await assertAdmin();
    await writeList([...artwork]);
};

// 이미지 정보 삭제하기
export const delArtwork = async (artwork: Artwork[], id: string): Promise<void> => {
    await assertAdmin();
    await writeList(artwork.filter((item) => item.id !== id));
};


// 음악 목록 (저장소 목록 조회 1번)
const listMusic = async (): Promise<MusicBlob[]> => {
    // 해당 경로 파일들 가져오기 
    const { blobs } = await list({ prefix: "music/" });

    return blobs.filter(blob =>
        blob.pathname.endsWith('.mp3') ||
        blob.pathname.endsWith('.wav')
    ).map((e: any) => ({
        ...e,
        title: e.pathname.split('/')[1],
        id: e.url,
        uploadedAt: e.uploadedAt.toLocaleString()
    }));
};

const cachedMusicList = unstable_cache(listMusic, ["music-list"], { tags: [MUSIC_TAG], revalidate: LIST_MAX_AGE });

// 음악 목록 (공개 화면용: 저장소 조회를 캐시)
export const getMusicList = async (): Promise<MusicBlob[]> => {
    return await cachedMusicList();
};

// 음악 목록 (관리자 화면용: 캐시 없이 저장소에서 바로)
export const getMusicListFresh = async (): Promise<MusicBlob[]> => {
    await assertAdmin();
    return await listMusic();
};

// 음악 파일은 브라우저에서 저장소로 바로 올리므로, 올린 뒤 이걸 불러서 공개 화면의 음악 목록 캐시를 비움
export const refreshMusicList = async (): Promise<void> => {
    await assertAdmin();
    revalidateTag(MUSIC_TAG);
};

// export const putMusic = async (file: File) => {
//     const pathname = `music/${file.name}`;
//     await put(pathname, file, {
//         access: 'public',
//         contentType: file.type || 'audio/mpeg'
//     });
// };

export const delMusic = async (pathname: string) => {
    await assertAdmin();
    await del(pathname);
    revalidateTag(MUSIC_TAG);
};
