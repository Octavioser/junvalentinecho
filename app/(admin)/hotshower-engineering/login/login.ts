"use server";
import { redirect } from "next/navigation";
import { authenticator } from "otplib";
import { cookies } from "next/headers";
import { SignJWT } from 'jose';

// jwt 검증은 middleware.js 에서 진행

// ✅ 서버 액션: 6자리 코드 검증 + 세션 쿠키 설정
export const loginAction = async (formData: FormData) => {
    "use server";

    const id = String(formData.get("eg") ?? "");
    const code = String(formData.get("code") ?? "");
    const ok = authenticator.verify({
        token: code,
        secret: process.env.ADMIN_TOTP_SECRET!, // Base32
    });
    if (!ok || id !== process.env.ADMIN_TOTP_EMAIL) return redirect("/");
    // ▶ JWT 만들기 (8시간 유효)
    const jwt = await new SignJWT({ sub: "admin-1", role: "admin", v: 1 })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("8h")
        .sign(new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!));

    // ▶ 쿠키에 저장 (HttpOnly/Strict)
    (await cookies()).set(process.env.ADMIN_SESSION_COOKIE ?? 'admin_session', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 8,           // 필요하면 명시
    });
    redirect("/hotshower-engineering");
};