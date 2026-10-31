"use client";
import { Fragment, useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./navigation.module.css";

const INTERNAL_PAGES = ['/', '/visual', '/3d'];

// 3D 메뉴에 마우스를 올리거나 누르는 순간 3D 모듈(three.js)을 미리 받기 시작
const preload3d = () => { import("@/3d/scene/Scene"); };

const Nav = () => {

    const path = usePathname();
    const router = useRouter();

    const [navOpen, setNavOpen] = useState(false);
    const [hoveredLink, setHoveredLink] = useState<string | null>(null);

    const clickFunc = useRef<Function | null>(null);

    useEffect(() => { setNavOpen(false); }, [path]); // 새로운페이지 접속시 닫히게

    // 메뉴를 눌렀을 때 로딩 화면이 바로 뜨게 페이지를 미리 받아 둠 (배포 환경에서 동작)
    useEffect(() => { INTERNAL_PAGES.forEach(href => router.prefetch(href)); }, [router]);

    // hook을 모두 부른 다음에 숨겨야 관리자 ↔ 일반 페이지를 오갈 때 hook 개수가 바뀌지 않음
    if (path.includes('hotshower-engineering')) return <></>;

    const isMain = path === '/';

    const { navContainer, mainTitle, hamburger, nav, show, open, navItem, active } = styles;

    return (
        <Fragment>
            <button className={hamburger}
                onClick={() => setNavOpen((prev) => !prev)}
            >☰
            </button>
            <div className={`${navContainer} ${navOpen ? open : ''}`}>
                {isMain && <div className={mainTitle}><span>JOONHYEOK DANIEL CHO</span></div>}
                <nav className={`${nav} ${navOpen ? show : ''}`}>
                    <ul>
                        {[
                            { href: '/', label: 'HOME' },
                            { href: 'https://soundcloud.com/junvalentinecho', label: 'SOUND', target: '_blank', rel: 'noopener noreferrer' },
                            { href: '/visual', label: '2D' },
                            { href: '/3d', label: '3D' },
                            { href: '/info', label: 'cv/bio' },
                            { href: 'https://www.xip.red/', label: 'XIP', target: '_blank', rel: 'noopener noreferrer' }
                        ].map((item) => {
                            const isHovered = hoveredLink === item.href;
                            // 호버 중이면 호버된 것만 선명, 아니면 현재 경로와 일치하는 것만 선명
                            // 단, main('/') 페이지에서는 다른 메뉴 블러 처리 제외 (모두 선명하게)
                            const isActive = (path === '/') || (hoveredLink ? isHovered : path === item.href);

                            return (
                                <li key={item.label}>
                                    <div
                                        className={`${navItem} ${isActive ? active : ''}`}
                                        onMouseOver={() => setHoveredLink(item.href)}
                                        onMouseOut={() => setHoveredLink(null)}
                                        style={{ cursor: 'pointer' }}
                                        onPointerEnter={() => { if (item.href === '/3d') preload3d(); }}
                                        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
                                            if (item.href === '/3d') preload3d();
                                            clickFunc.current = () => {
                                                const pointerType = e.pointerType;
                                                // 터치이면서 아직 활성화(호버)되지 않은 상태라면 -> 활성화만 하고 끝냄
                                                // 단, 모바일 햄버거 메뉴가 열려 있을 때는 한 번 탭으로 바로 이동
                                                if (pointerType === 'touch' && !navOpen && hoveredLink !== item.href) {
                                                    setHoveredLink(item.href);
                                                    return;
                                                }
                                                // 그 외(이미 활성화됨 or 마우스 클릭) -> 네비게이션 동작
                                                setNavOpen(false);
                                                if (item.target === '_blank') {
                                                    window.open(item.href, '_blank', 'noopener,noreferrer');
                                                } else {
                                                    router.push(item.href);
                                                }
                                            };
                                        }}
                                        onPointerLeave={() => { clickFunc.current = null; }}
                                        onPointerUp={() => { clickFunc.current && clickFunc.current(); }}
                                    >
                                        <span>{item.label}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </Fragment>
    );
};

export default Nav;