import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // 용량이 크면 ㅇ안되서 추가 

export async function POST(req: Request) {
    try {
        // 1. FormData에서 파일 추출
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: '파일이 없습니다.' },
                { status: 400 }
            );
        }

        // 2. mp3 / wav 체크
        const isAudioExt = /\.(mp3|wav)$/i.test(file.name);
        const isAudioMime = ['audio/mpeg', 'audio/wav'].includes(file.type);

        if (!isAudioExt || (!isAudioMime && file.type !== '')) {
            return NextResponse.json(
                { error: 'mp3 또는 wav 파일만 업로드할 수 있습니다.' },
                { status: 400 }
            );
        }

        // 3. Blob 경로
        const pathname = `music/${file.name}`;

        // 4. 업로드
        const blob = await put(pathname, file, {
            access: 'public',
            contentType: file.type || 'audio/mpeg'
        });

        // 5. 성공 응답
        return NextResponse.json({
            pathname: blob.pathname,
            url: blob.url
        });
    } catch (error) {
        console.error('[music upload error]', error);
        return NextResponse.json(
            { error: '음악 업로드 실패' },
            { status: 500 }
        );
    }
}
