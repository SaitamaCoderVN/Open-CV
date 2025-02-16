interface Player {
    id: string;
    username: string;
    avatar: string;
    level: number;
    detailed_xp: number[] | undefined
}

export type { Player };