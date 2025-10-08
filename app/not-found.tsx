import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: 'notFound',
};


const NotFound = () =>
    <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '30px',
        transform: 'translateY(-10%)'
    }}>
        <span>404 Page Not Found</span>
        <div><Link href="/"><span style={{ textDecoration: 'underline' }}>Go Home</span></Link></div>
    </div>
    ;

export default NotFound;