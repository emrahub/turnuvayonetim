import { PrismaClient } from '@prisma/client';
export interface SeatingConfig {
    maxPlayersPerTable: number;
    minPlayersPerTable: number;
    balanceThreshold: number;
}
export interface SeatingResult {
    assignments: Array<{
        entryId: string;
        tableId: string;
        seatNumber: number;
    }>;
    tablesCreated: number;
    totalPlayers: number;
    averagePlayersPerTable: number;
}
export declare class SeatingService {
    private prisma;
    constructor(prisma: PrismaClient);
    seatPlayers(tournamentId: string, config?: SeatingConfig): Promise<SeatingResult>;
    rebalanceTables(tournamentId: string, config?: SeatingConfig): Promise<SeatingResult>;
    eliminatePlayer(entryId: string): Promise<void>;
    private calculateOptimalTableCount;
    private ensureTables;
    private clearExistingSeating;
    private balancedSeatingAlgorithm;
    private saveSeatingAssignments;
    private getTableStats;
    private getCurrentAssignments;
    private needsRebalancing;
}
//# sourceMappingURL=seating.service.d.ts.map