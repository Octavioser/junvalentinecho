import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// 관리자 로그인 확인 (middleware.ts와 같은 쿠키·비밀키).
// 서버 액션·API는 주소만 알면 관리자 페이지를 거치지 않고도 부를 수 있어서, 데이터를 바꾸는 쪽에서 직접 확인해야 함
export async function isAdmin(): Promise<boolean> {
    const token = (await cookies()).get(process.env.ADMIN_SESSION_COOKIE || 'admin_session')?.value;
    if (!token) return false;
    try {
        await jwtVerify(token, new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!), { algorithms: ["HS256"] });
        return true;
    } catch {
        return false;
    }
}

export async function assertAdmin(): Promise<void> {
    if (!(await isAdmin())) throw new Error("Unauthorized");
}
