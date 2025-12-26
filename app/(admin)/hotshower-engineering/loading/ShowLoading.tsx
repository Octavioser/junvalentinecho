const ShowLoading = () => (
    <div
        style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}
    >
        <div style={{ padding: 20 }}>
            loading...
        </div>
    </div>
);
export default ShowLoading;