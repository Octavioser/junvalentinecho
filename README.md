# junvalentinecho
# junvalentinecho


구조화된 데이터(artwork 정보, 텍스트 등) → Vercel KV(Key-Value)에 저장

이미지 등 바이너리 파일 → Vercel Blob에 저장, URL만 KV/DB에 기록

→ 프론트에서는 KV에서 artwork 정보 받아오고, imageUrl 필드는 blob url을 <img src={imageUrl}>로 바로 사용