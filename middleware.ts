// middleware.ts
// nextjs가 알아서 이파일을 인식
// 미들웨어란 **요청(Request)**이 들어와서 **응답(Response)**이 나가기 전,
// 중간에서 실행되는 코드
// Next.js에서는 middleware.ts 파일을 만들면 모든 페이지/라우트에 접근하기 전에 실행

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const PROTECTED = "/hotshower-engineering";
const SECRET = new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!);


export async function middleware(req: NextRequest) {
    "use server";

    const { pathname } = req.nextUrl;
    // 어드민 페이지가 아니면 통과 
    if (!pathname.startsWith(PROTECTED)) return NextResponse.next();
    // 로그인페이지 통과
    if (pathname.startsWith(`${PROTECTED}/login`)) return NextResponse.next();
    const cookieName = process.env.ADMIN_SESSION_COOKIE || 'admin_session';
    const token = req.cookies.get(cookieName)?.value;
    if (!token) return redirectToLogin(req);

    try {
        await jwtVerify(token, SECRET, { algorithms: ["HS256"] });
        return NextResponse.next();
    } catch {
        // 쿠키 삭제후 홈으로 이동
        const url = req.nextUrl.clone();
        url.pathname = "/";
        const res = NextResponse.redirect(url);
        res.cookies.set(cookieName, "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // 운영인지 개발인지
            sameSite: "strict",
            path: "/",
            maxAge: 0, // 삭제
        });
        return res;
    }
}

const redirectToLogin = (req: NextRequest) => {
    const url = req.nextUrl.clone();              // 현재 요청의 절대 URL 기반
    url.pathname = `${PROTECTED}/login`;          // 상대경로 X, pathname 수정 O
    return NextResponse.redirect(url);            // URL 객체 전달 → OK
};