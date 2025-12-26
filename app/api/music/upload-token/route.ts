import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export const runtime = 'nodejs'; // 안전빵

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

            onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
                // 업로드 제한/검증
                return {
                    allowedContentTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav'],
                    maximumSizeInBytes: 1024 * 1024 * 100, // 예: 100MB
                    tokenPayload: clientPayload,
                    addRandomSuffix: false,
                };
            },
            onUploadCompleted: async ({ }: {}) => {
                // 여기에 blob.url DB 저장
                // console.log('uploaded:', blob.url, tokenPayload);
            },
        });

        // ✅ 성공 분기에서도 return
        return NextResponse.json(jsonResponse);
    } catch (e) {
        // ✅ 실패 분기에서도 return
        console.error(e);
        return NextResponse.json(
            { error: (e as Error)?.message ?? 'Upload token error' },
            { status: 500 },
        );
    }
}