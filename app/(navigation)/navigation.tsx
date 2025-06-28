"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./navigation.module.css";


const nav = () => {
    const path = usePathname();
    if (path.includes('hotshower-engineering')) return <></>;

    return (
        <>
            <nav className={styles.nav}>
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
                        <Link href="/info">INFO</Link>
                    </li>
                    <li>
                        <Link href="https://www.xip.red/" target="_blank" rel="noopener noreferrer">XIP</Link>
                    </li>
                </ul>
            </nav>
            <div style={{ marginTop: '5vh', borderBottom: '1px solid #f0f0f0' }}></div>
        </>
    )
}

export default nav;