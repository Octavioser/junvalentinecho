export default function Loading() {
    return <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '30px',
        transform: 'translateY(-10%)'
    }}>
        <span>...Loading</span>
    </div>;
}