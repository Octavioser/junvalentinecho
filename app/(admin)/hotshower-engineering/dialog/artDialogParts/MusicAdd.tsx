import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MusicBlob } from "@/types";
import { upload } from '@vercel/blob/client';
import { snackbar } from "@/components/Snackbar/Snackbar";
import styles from "../ArtAddDialog.module.css";

const MusicAdd = ({ musicList, setOpenDialog, setIsLoading }:
    { musicList: MusicBlob[], setOpenDialog: React.Dispatch<React.SetStateAction<"add" | "mod" | null>>, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>; }) => {

    const [inputFile, setInputFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // 같은 파일을 다시 골라도 다시 검사
        if (!file) return;

        if (
            musicList.some(({ title }) => title.trim() === file.name.trim())
        ) {
            setError('같은 이름의 음악이 이미 있어요.');
            setInputFile(null);
            return;
        }

        setError(null);
        setInputFile(file);
    };

    const { musicPicker, musicFileName, fileButton, hint, errorText, footer, primaryButton, secondaryButton } = styles;

    return (
        <>
            <div className={musicPicker}>
                <div className={musicFileName}>{inputFile ? inputFile.name : '선택한 파일 없음'}</div>
                <label className={fileButton}>
                    {inputFile ? '다른 파일 선택' : '음악 파일 선택'}
                    <input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={handleImageChange} />
                </label>
                {error ? <div className={errorText}>{error}</div> : <div className={hint}>mp3 또는 wav 파일, 최대 100MB. 파일 이름이 홈 화면 곡 이름으로 보여요.</div>}
            </div>
            <div className={footer}>
                <button type="button" className={secondaryButton} onClick={() => setOpenDialog(null)}>취소</button>
                <button
                    type="button"
                    className={primaryButton}
                    disabled={!inputFile}
                    onClick={async () => {
                        setIsLoading(true);
                        // 용량이커서 안됨
                        // await putMusic(inputFile);
                        try {


                            if (!inputFile) {
                                setError('파일을 먼저 선택하세요.');
                                return;
                            }

                            const blob = await upload(`music/${inputFile.name}`, inputFile, {
                                access: 'public',
                                handleUploadUrl: '/api/music/upload-token',   // 서버 토큰 발급 라우트
                                multipart: true,                      // 큰 파일이면 권장
                                clientPayload: JSON.stringify({ kind: 'music' }),
                            });
                            if (!blob?.url) throw new Error('Upload succeeded but no URL returned');

                            setOpenDialog(null);
                            snackbar.success('음악이 추가되었습니다.');
                            router.refresh(); // 페이지 새로고침
                        } catch (error) {
                            console.log(error);
                            snackbar.error('저장에 실패했습니다.');
                        } finally {
                            setIsLoading(false);
                        }

                    }}>
                    저장
                </button>
            </div>
        </>
    );

};
export default MusicAdd;
