'use server';
import { Artwork, ArtworkList } from "@/types";
import { put, del, head, list } from '@vercel/blob';

export const api = async (apiUrl: string) => {
    try {
        const fetchdata = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/${apiUrl}`, {
            method: 'POST', // POST 요청
            headers: {
                'Content-Type': 'application/json', // 요청 타입
            },
        });
        // fetch 실패시 에러 처리
        if (!fetchdata.ok) throw new Error(`HTTP Error: ${fetchdata.status}`);
        // json 형태 변환시 에러 처리
        return await (async () => {
            try {
                return { ok: true, data: await fetchdata.json(), error: null, };
            }
            catch (error: any) {
                throw new Error(`json() Error status: ${fetchdata.status}`);
            }
        })();
    } catch (error: any) {
        console.log(error);
        return {
            ok: false,
            data: null,
            error: error.message || 'error',
        };
    }
};

const slug = (s: string) =>
    s
        .trim()                          // 1) 앞뒤 공백 제거
        .toLowerCase()                   // 2) 소문자화
        .replace(/[^\w.-]+/g, "-")       // 3) 영숫자/밑줄(_)/점(.)/하이픈(-) 외 문자를 하이픈으로 치환
        .replace(/-+/g, "-")             // 4) 연속 하이픈을 하나로 축약
        .replace(/^-|-$|^\.+/g, "");     // 5) 선두 하이픈, 끝 하이픈, 선두의 점(숨김파일 방지) 제거


export const uploadImage = async (file: File, title: string, url?: string | null) => {
    // 1) 기존 파일 URL이 있으면 Blob에서 삭제
    url && await delImage(url);

    // 2) 확장자 결정: 파일명 → MIME 타입 → 기본값("bin") 순
    const { name, type } = file;
    const fromName = name.includes(".") ? name.split(".")[name.split(".").length - 1] : "";
    const fromMime = type.includes("/") ? type.split("/")[type.split("/").length - 1] : "";
    const ext = (fromName || fromMime || "bin").toLowerCase();

    // 3) title에 확장자가 붙어있다면 제거 후 slug 처리
    const baseTitle = title.replace(/\.[^.]+$/, "");
    const targetPath = `images/${slug(baseTitle)}.${ext}`;

    // 4) 업로드: 공개 접근, 1년 캐시, 캐시 무효화를 위한 랜덤 접미사, 덮어쓰기 허용
    const { url: newUrl } = await put(targetPath, file, {
        access: "public",
        contentType: file.type || undefined,
        cacheControlMaxAge: 60 * 60 * 24 * 365, // 1년(초)
        addRandomSuffix: true,                   // URL 변경(캐시 무효화/이름 충돌 방지)
    });

    // 5) 퍼블릭 URL 반환
    return newUrl;
};

// 이미지 삭제 
export const delImage = async (url: string) => {
    try {
        if (!url) throw new Error("URL is required");
        await del(url);
    } catch (err) {
        console.log(err);
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

export const readList = async (): Promise<ArtworkList> => {
    // 해당 경로 파일들 가져오기 
    const { blobs } = await list({ prefix: JSON_PREFIX });
    // json만 
    const jsons = blobs.filter(b => b.pathname.endsWith(".json"));
    if (jsons.length === 0) return [];
    // 최신순으로
    jsons.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    const res = await fetch(jsons[0].url, { cache: "no-store" });
    return res.ok ? await res.json() : [];
};

export const writeList = async (artworkList: ArtworkList) => {
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
export const getArtworks = async (): Promise<ArtworkList> => {
    return await readList();
};

// 이미지 정보 추가하기
export const addArtwork = async (artwork: Artwork): Promise<Artwork> => {
    const data = await readList();
    await writeList([...data, artwork]);
    return artwork;
};

// 이미지 정보 수정하기
export const updateArtwork = async (artwork: Artwork): Promise<void> => {
    const data = await readList();
    await writeList(data.map((item) => (item.id === artwork.id ? artwork : item)));
};

// 이미지 정보 삭제하기
export const delArtwork = async (id: string): Promise<void> => {
    const data = await readList();
    await writeList(data.filter((item) => item.id !== id));
};

