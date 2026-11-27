// proxy.ts (Next 15까지는 middleware.ts)
// nextjs가 알아서 이파일을 인식
// 프록시(예전 이름 미들웨어)란 **요청(Request)**이 들어와서 **응답(Response)**이 나가기 전,
// 중간에서 실행되는 코드
// Next.js에서는 proxy.ts 파일을 만들면 페이지/라우트에 접근하기 전에 실행 (어느 주소에서 실행할지는 맨 아래 config.matcher)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED = "/hotshower-engineering";
const SECRET = new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!);


export async function proxy(req: NextRequest) {
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

// 이 프록시를 실행할 주소: 관리자 주소(/hotshower-engineering 과 그 아래)뿐. 위의 PROTECTED와 같은 주소여야 함
// (Next가 빌드할 때 읽는 값이라 변수를 쓸 수 없고 글자 그대로 적어야 함).
// matcher를 적지 않으면 그림 사본(/_next/image)·JS·CSS(/_next/static)까지 모든 요청마다 실행돼서,
// 관리자와 상관없는 방문에도 요청 수만큼 실행 횟수(Vercel 사용량)가 쌓임. 그런 요청은 어차피 위에서 바로 통과시키던 것
export const config = {
    matcher: ['/hotshower-engineering/:path*'],
};