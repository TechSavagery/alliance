import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { TeamMembership } from './TeamMembership';
import { GameSession } from './GameSession';

export enum TeamStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISBANDED = 'disbanded'
}

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  logoUrl: string;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({
    type: 'enum',
    enum: TeamStatus,
    default: TeamStatus.ACTIVE
  })
  status: TeamStatus;

  @Column('uuid')
  leaderId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'leaderId' })
  leader: User;

  @Column({ default: 4 })
  maxMembers: number;

  @Column({ default: 0 })
  totalGamesPlayed: number;

  @Column({ default: 0 })
  totalWins: number;

  @Column({ default: 0 })
  totalLosses: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  winRate: number;

  @Column({ default: 0 })
  totalScore: number;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  bestStreak: number;

  @Column({ default: 1 })
  teamLevel: number;

  @Column({ default: 0 })
  teamExperience: number;

  @Column({ length: 50, default: 'Rookie Squad' })
  teamRank: string;

  @Column({ type: 'json', nullable: true })
  gameTypeStats: {
    [gameType: string]: {
      played: number;
      won: number;
      lost: number;
      totalScore: number;
      bestScore: number;
      averageScore: number;
    };
  };

  @Column({ type: 'json', nullable: true })
  weeklySchedule: {
    day: string;
    time: string;
    duration: number;
    gameType?: string;
    isRecurring: boolean;
  }[];

  @Column({ type: 'json', nullable: true })
  achievements: {
    id: string;
    name: string;
    description: string;
    unlockedAt: Date;
    iconUrl?: string;
  }[];

  @Column({ type: 'json', nullable: true })
  settings: {
    isPublic: boolean;
    allowInvites: boolean;
    autoAssignRoles: boolean;
    difficultyPreference: 'easy' | 'medium' | 'hard' | 'adaptive';
    sessionReminders: boolean;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => TeamMembership, membership => membership.team, { eager: true })
  memberships: TeamMembership[];

  @OneToMany(() => GameSession, session => session.team)
  gameSessions: GameSession[];

  // Computed properties
  get memberCount(): number {
    return this.memberships?.filter(m => m.status === 'active').length || 0;
  }

  get averageScore(): number {
    return this.totalGamesPlayed > 0 ? this.totalScore / this.totalGamesPlayed : 0;
  }

  get progressToNextLevel(): number {
    const expForCurrentLevel = this.teamLevel * 2000;
    const expForNextLevel = (this.teamLevel + 1) * 2000;
    const currentLevelProgress = this.teamExperience - expForCurrentLevel;
    const totalExpNeeded = expForNextLevel - expForCurrentLevel;
    return Math.min(100, (currentLevelProgress / totalExpNeeded) * 100);
  }

  get activeMembers(): TeamMembership[] {
    return this.memberships?.filter(m => m.status === 'active') || [];
  }

  get mostPlayedGame(): string | null {
    if (!this.gameTypeStats) return null;
    
    let maxPlayed = 0;
    let mostPlayed = null;
    
    for (const [gameType, stats] of Object.entries(this.gameTypeStats)) {
      if (stats.played > maxPlayed) {
        maxPlayed = stats.played;
        mostPlayed = gameType;
      }
    }
    
    return mostPlayed;
  }

  // Methods
  addExperience(amount: number): void {
    this.teamExperience += amount;
    const newLevel = Math.floor(this.teamExperience / 2000) + 1;
    if (newLevel > this.teamLevel) {
      this.teamLevel = newLevel;
      this.updateTeamRank();
    }
  }

  updateTeamRank(): void {
    if (this.teamLevel >= 100) this.teamRank = 'Legendary Alliance';
    else if (this.teamLevel >= 80) this.teamRank = 'Elite Strike Force';
    else if (this.teamLevel >= 60) this.teamRank = 'Veteran Coalition';
    else if (this.teamLevel >= 45) this.teamRank = 'Advanced Unit';
    else if (this.teamLevel >= 30) this.teamRank = 'Tactical Squad';
    else if (this.teamLevel >= 20) this.teamRank = 'Combat Team';
    else if (this.teamLevel >= 10) this.teamRank = 'Strike Team';
    else if (this.teamLevel >= 5) this.teamRank = 'Patrol Unit';
    else this.teamRank = 'Rookie Squad';
  }

  updateWinRate(): void {
    const totalGames = this.totalWins + this.totalLosses;
    this.winRate = totalGames > 0 ? (this.totalWins / totalGames) * 100 : 0;
  }

  updateGameTypeStats(gameType: string, won: boolean, score: number): void {
    if (!this.gameTypeStats) {
      this.gameTypeStats = {};
    }

    if (!this.gameTypeStats[gameType]) {
      this.gameTypeStats[gameType] = {
        played: 0,
        won: 0,
        lost: 0,
        totalScore: 0,
        bestScore: 0,
        averageScore: 0
      };
    }

    const stats = this.gameTypeStats[gameType];
    stats.played++;
    stats.totalScore += score;
    
    if (won) {
      stats.won++;
    } else {
      stats.lost++;
    }
    
    if (score > stats.bestScore) {
      stats.bestScore = score;
    }
    
    stats.averageScore = stats.totalScore / stats.played;
  }

  addAchievement(achievement: { id: string; name: string; description: string; iconUrl?: string }): void {
    if (!this.achievements) {
      this.achievements = [];
    }
    
    const exists = this.achievements.find(a => a.id === achievement.id);
    if (!exists) {
      this.achievements.push({
        ...achievement,
        unlockedAt: new Date()
      });
    }
  }

  canAcceptNewMember(): boolean {
    return this.memberCount < this.maxMembers && this.status === TeamStatus.ACTIVE;
  }

  isLeader(userId: string): boolean {
    return this.leaderId === userId;
  }

  isMember(userId: string): boolean {
    return this.activeMembers.some(m => m.userId === userId);
  }
}