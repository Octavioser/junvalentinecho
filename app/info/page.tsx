export const metadata = { title: 'cv/bio' };

const Info = () =>
    <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: 'translateY(-10%)'
    }}>
        {/* 새 탭으로 열어서 이 탭의 노래는 계속 나오게 */}
        <a href="https://www.instagram.com/hotshower22/" target="_blank" rel="noopener noreferrer">
            <span style={{ textDecoration: 'underline' }}>Instagram</span>
        </a>
    </div>;

export default Info;
