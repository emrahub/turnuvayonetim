interface BlindLevel {
    idx: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    durationSeconds: number;
    isBreak: boolean;
    breakName?: string;
}
interface TournamentClockProps {
    tournamentId: string;
    levels: BlindLevel[];
    isController?: boolean;
}
export declare function TournamentClock({ tournamentId, levels, isController }: TournamentClockProps): import("react").JSX.Element;
export default TournamentClock;
//# sourceMappingURL=TournamentClock.d.ts.map