'use server';
import { Artwork, MusicBlob } from "@/types";
import { put, del, head, list } from '@vercel/blob';
import { unstable_noStore } from 'next/cache';
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

export const readList = async (): Promise<Artwork[]> => {
    unstable_noStore();
    // 해당 경로 파일들 가져오기 
    const { blobs } = await list({ prefix: JSON_PREFIX });
    // json만 
    const jsons = blobs.filter(b => b.pathname.endsWith(".json"));
    if (jsons.length === 0) return [];
    // 최신순으로
    jsons.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    const res = await fetch(jsons[0].url, {});
    return res.ok ? await res.json() : [];
};

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

    // 방금 올린 것을 제외하고 이전 것들은 나머지를 지워야 함
    const { blobs } = await list({ prefix: JSON_PREFIX });
    const oldJsons = blobs.filter(b => b.pathname.endsWith(".json") && b.pathname !== newPath);

    oldJsons.length && await del(oldJsons.map(b => b.pathname));
};


// 이미지 정보 데이터 가져오기
export const getArtworks = async (): Promise<Artwork[]> => {
    return await readList();
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


export const getMusicList = async (): Promise<MusicBlob[]> => {
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
};
