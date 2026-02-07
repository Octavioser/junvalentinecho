"use client";
import { Fragment, useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./navigation.module.css";


const Nav = () => {

    const path = usePathname();
    const router = useRouter();
    if (path.includes('hotshower-engineering')) return <></>;

    const isMain = path === '/';

    useEffect(() => { setNavOpen(false); }, [path]); // 새로운페이지 접속시 닫히게

    const [navOpen, setNavOpen] = useState(false);
    const [hoveredLink, setHoveredLink] = useState<string | null>(null);

    const clickFunc = useRef<Function | null>(null);

    const { navContainer, mainTitle, hamburger, nav, show, open, navItem, active } = styles;

    return (
        <Fragment>
            <button className={hamburger}
                onClick={() => setNavOpen((prev) => !prev)}
            >☰
            </button>
            <div className={navContainer}>
                {isMain && <div className={mainTitle}><span>JOONHYEOK DANIEL CHO</span></div>}
                <nav className={`${nav} ${navOpen ? show : ''}`}>
                    <ul>
                        {[
                            { href: '/', label: 'HOME' },
                            { href: 'https://soundcloud.com/junvalentinecho', label: 'SOUND', target: '_blank', rel: 'noopener noreferrer' },
                            { href: '/visual', label: 'VISUAL' },
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
                                        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
                                            clickFunc.current = () => {
                                                const pointerType = e.pointerType;
                                                // 터치이면서 아직 활성화(호버)되지 않은 상태라면 -> 활성화만 하고 끝냄
                                                if (pointerType === 'touch' && hoveredLink !== item.href) {
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