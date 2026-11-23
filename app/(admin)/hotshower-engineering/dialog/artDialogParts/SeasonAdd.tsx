"use client";
import React, { useState } from "react";
import { Artwork } from "@/types";
import { useRouter } from "next/navigation";
import { updateAllArtwork } from "@/common/comon";
import { createSeason, renameSeason, seasonNames } from "@/common/season";
import { snackbar } from "@/components/Snackbar/Snackbar";
import ArtPicker from "./ArtPicker";
import styles from "../ArtAddDialog.module.css";

// 시즌 이름을 쓸 수 없는 이유 (쓸 수 있으면 null). current: 이름을 바꾸는 중인 시즌 (자기 이름은 그대로 둬도 됨)
const nameProblem = (name: string, artworks: Artwork[], current?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return '시즌 이름을 입력해주세요.';
    if (trimmed !== current && seasonNames(artworks).includes(trimmed)) return '이미 있는 시즌 이름이에요.';
    return null;
};

// 2D 시즌 탭의 창. add: 새 시즌 만들기 (이름 + 넣을 그림들, 처음 고른 그림이 대표), mod: 고른 시즌의 이름 바꾸기
const SeasonAdd = ({ artworks, selectedSeason, setSelectedSeason, openDialog, setOpenDialog, setIsLoading }: {
    artworks: Artwork[];
    selectedSeason: string | null;
    setSelectedSeason: (season: string | null) => void;
    openDialog: "add" | "mod";
    setOpenDialog: React.Dispatch<React.SetStateAction<"add" | "mod" | null>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const renaming = openDialog === 'mod' ? selectedSeason ?? undefined : undefined;
    const [name, setName] = useState(renaming ?? '');
    const [touched, setTouched] = useState(false); // 입력을 시작한 뒤에만 오류를 보여 줌
    const router = useRouter();
    const problem = nameProblem(name, artworks, renaming);

    const save = async (next: Artwork[], message: string) => {
        setIsLoading(true);
        try {
            await updateAllArtwork(next);
            setSelectedSeason(name.trim());
            setOpenDialog(null);
            snackbar.success(message);
            router.refresh(); // 페이지 새로고침
        } catch (error) {
            console.log(error);
            snackbar.error('저장에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const { picker, pickerHint, footer, input, errorText, primaryButton, secondaryButton } = styles;
    const nameField = (
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 32px 0', fontSize: 13, fontWeight: 500 }}>
            시즌 이름
            <input className={input} style={{ flex: 1, maxWidth: 360 }} type="text" value={name} autoFocus
                onChange={(e) => { setName(e.target.value); setTouched(true); }} />
        </label>
    );

    if (renaming) {
        return (
            <div className={picker}>
                <div className={pickerHint}>시즌 이름을 바꾸면 2D 화면에 보이는 이름과 그 시즌의 주소도 같이 바뀌어요.</div>
                {nameField}
                <div style={{ flex: 1 }} />
                <div className={footer}>
                    {touched && problem && <div className={errorText}>{problem}</div>}
                    <button type="button" className={secondaryButton} onClick={() => setOpenDialog(null)}>취소</button>
                    <button type="button" className={primaryButton} disabled={!!problem || name.trim() === renaming}
                        onClick={() => save(renameSeason(artworks, renaming, name.trim()), '시즌 이름이 바뀌었습니다.')}>저장</button>
                </div>
            </div>
        );
    }

    return (
        <ArtPicker
            hint="새 시즌의 이름을 적고 넣을 그림을 순서대로 누르세요. 여러 개를 한 번에 고를 수 있어요. 1번 그림이 2D 화면에서 시즌을 대표하고(나중에 바꿀 수 있어요), 다른 시즌에 있던 그림은 그 시즌에서 빠져요."
            candidates={artworks}
            emptyText="등록된 그림이 없어요."
            confirmLabel="시즌 만들기"
            blocked={problem}
            onCancel={() => setOpenDialog(null)}
            onPick={(ids) => save(createSeason(artworks, name.trim(), ids), '시즌이 만들어졌습니다.')}
        >
            {nameField}
        </ArtPicker>
    );
};
export default SeasonAdd;
