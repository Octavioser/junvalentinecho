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

    const { navContainer, mainTitle, hamburger, nav, show, open } = styles;

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
                        <li>
                            <Link href="/" onClick={() => { setNavOpen(false); }}><span>HOME</span></Link>
                        </li>
                        <li>
                            <Link href="https://soundcloud.com/junvalentinecho" onClick={() => { setNavOpen(false); }} target="_blank" rel="noopener noreferrer"><span>SOUND</span></Link>
                        </li>
                        <li>
                            <Link href="/visual" onClick={() => { setNavOpen(false); }}><span>VISUAL</span></Link>
                        </li>
                        <li>
                            <Link href="/info" onClick={() => { setNavOpen(false); }}><span>cv/bio</span></Link>
                        </li>
                        <li>
                            <Link href="https://www.xip.red/" onClick={() => { setNavOpen(false); }} target="_blank" rel="noopener noreferrer"><span>XIP</span></Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </Fragment>
    );
};

export default Nav;