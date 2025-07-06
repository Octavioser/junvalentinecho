'use server';
import { kv } from '@vercel/kv';
import { Artwork, ArtworkList } from "@/types";
import { put, del } from '@vercel/blob';

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

// 이미지 blob 업로드 url 있으면 삭제까지 
export const uploadImage = async (file: File, title: string, url?: string | null) => {

    // url 존재하면 삭제 
    if (url) await del(url);


    // 2) Vercel Blob에 업로드
    //    - 첫 번째 인자: 저장할 경로/파일명 (중복 방지를 위해 랜덤 접미사 옵션 사용)
    //    - 두 번째 인자: Blob 객체
    //    - 옵션: public 접근, 캐시 60초 유지, 이름 뒤에 랜덤 문자열 추가
    const blob = await put(title, file, {
        access: 'public',
        cacheControlMaxAge: 365 * 24 * 60 * 60, // 1년
        addRandomSuffix: true,
    });

    // 3) 업로드된 파일의 URL 반환
    //    반환값이 클라이언트 컴포넌트의 제출결과로 전달됩니다.
    return blob.url;
};

export const delImage = async (url: string) => {
    await del(url);
};


// 이미지 정보 데이터 가져오기 
export const getArtworks = async () => {

    const data = await kv.get<ArtworkList>('artworks') || [];

    return data;
};

// 이미지 정보 추가하기 
export const addArtwork = async (Artwork: Artwork) => {

    const data = await kv.get<ArtworkList>('artworks') || [];

    kv.set('artworks', [...data, Artwork]);

    return Artwork;
};

// 이미지 정보 수정하기 
export const updateArtwork = async (Artwork: Artwork) => {
    const data = await kv.get<ArtworkList>('artworks') || [];
    kv.set('artworks', data.map((item) => (item.id === Artwork.id ? Artwork : item)));
};

// 이미지 정보 삭제하기 
export const delArtwork = async (id: string) => {

    const data = await kv.get<ArtworkList>('artworks') || [];

    kv.set('artworks', data.filter((item) => item.id !== id));
};

