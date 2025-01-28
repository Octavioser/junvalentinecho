import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// JSON 파일 경로 설정
const dataFilePath = path.join(process.cwd(), 'jsondata', 'movie.json');

// POST 메서드 처리
export const POST = async (req: NextRequest) => {
    // JSON 파일 읽기
    const fileData = fs.readFileSync(dataFilePath, 'utf-8');

    const jsonData = JSON.parse(fileData);

    // JSON 데이터를 반환
    return NextResponse.json(jsonData);
}

// 다른 HTTP 메서드는 처리하지 않음
export const GET = undefined;
export const PUT = undefined;
export const DELETE = undefined;