"use client";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./navigation.module.css";


const Nav = () => {

    const path = usePathname();
    if (path.includes('hotshower-engineering')) return <></>;

    const isMain = path === '/';

    useEffect(() => { setNavOpen(false); }, [path]); // 새로운페이지 접속시 닫히게

    const [navOpen, setNavOpen] = useState(false);

    const { navContainer, mainTitle, buttonGroup, hamburger, nav, show, open, mainOpen } = styles;

    return (
        <Fragment>
            <button className={`${hamburger} ${isMain ? '' : show}`}
                onClick={() => setNavOpen((prev) => !prev)}
            >☰
            </button>
            <div className={navContainer}>
                <div className={mainTitle}>
                    {isMain ? 'JOONHYEOK DANIEL CHO' : ''}
                </div>
                <div className={`${buttonGroup} ${navOpen ? open : ""} ${isMain ? mainOpen : ''}`}>
                    <nav className={`${nav} ${(isMain || navOpen) ? show : ''}`}>
                        <ul>
                            <li>
                                <Link href="/">HOME</Link>
                            </li>
                            <li>
                                <Link href="https://soundcloud.com/junvalentinecho" target="_blank" rel="noopener noreferrer">SOUND</Link>
                            </li>
                            <li>
                                <Link href="/visual">VISUAL</Link>
                            </li>
                            <li>
                                <Link href="/info">cv/bio</Link>
                            </li>
                            <li>
                                <Link href="https://www.xip.red/" target="_blank" rel="noopener noreferrer">XIP</Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </Fragment>
    );
};

export default Nav;