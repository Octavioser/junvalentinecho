import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { isAdmin } from '@/common/adminAuth';
import { IMAGE_TYPES, IMAGE_MAX_BYTES } from '@/common/image';

export const runtime = 'nodejs';

// 그림 파일을 브라우저에서 저장소로 바로 올릴 때 쓰는 허가증(토큰) 발급.
// 서버를 거치면 요청에 다른 정보가 같이 실려서 한도(4.5MB)를 꽉 채운 파일은 못 받으므로 저장소로 바로 올림 (음악 업로드와 같은 방식)
export async function POST(request: Request) {
    let body: HandleUploadBody;

    try {
        body = (await request.json()) as HandleUploadBody;
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    try {
        const jsonResponse = await handleUpload({
            request,
            body,

            onBeforeGenerateToken: async (pathname) => {
                // 관리자만 업로드 토큰 발급 (업로드 완료 알림은 Vercel 서버가 보내서 쿠키가 없으므로 여기서만 확인)
                if (!(await isAdmin())) throw new Error('Unauthorized');
                if (!pathname.startsWith('images/')) throw new Error('Invalid path');
                // 형식·크기는 저장소가 이 조건대로 다시 검사함
                return {
                    allowedContentTypes: Object.keys(IMAGE_TYPES),
                    maximumSizeInBytes: IMAGE_MAX_BYTES,
                    addRandomSuffix: true,                  // 주소가 겹치지 않게 (같은 제목으로 다시 올려도 새 주소)
                    cacheControlMaxAge: 60 * 60 * 24 * 365, // 1년(초)
                };
            },
            onUploadCompleted: async () => { },
        });

        return NextResponse.json(jsonResponse);
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { error: (e as Error)?.message ?? 'Upload token error' },
            { status: 500 },
        );
    }
}
