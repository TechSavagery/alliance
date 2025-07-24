import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany } from 'typeorm';
import { TeamMembership } from './TeamMembership';
import { GameSession } from './GameSession';
import { PlayerStats } from './PlayerStats';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({ length: 100, nullable: true })
  displayName: string;

  @Column({ length: 500, nullable: true })
  bio: string;

  @Column({ length: 255, nullable: true })
  avatarUrl: string;

  @Column({ default: 0 })
  totalGamesPlayed: number;

  @Column({ default: 0 })
  totalScore: number;

  @Column({ default: 0 })
  totalWins: number;

  @Column({ default: 0 })
  totalLosses: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  winRate: number;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  bestStreak: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  experience: number;

  @Column({ type: 'json', nullable: true })
  preferences: {
    favoriteGames?: string[];
    preferredRoles?: string[];
    notifications?: {
      email: boolean;
      teamInvites: boolean;
      gameReminders: boolean;
    };
  };

  @Column({ type: 'json', nullable: true })
  achievements: {
    id: string;
    name: string;
    description: string;
    unlockedAt: Date;
    iconUrl?: string;
  }[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => TeamMembership, membership => membership.user)
  teamMemberships: TeamMembership[];

  @OneToMany(() => PlayerStats, stats => stats.user)
  gameStats: PlayerStats[];

  @ManyToMany(() => GameSession, session => session.players)
  gameSessions: GameSession[];

  // Computed properties
  get averageScore(): number {
    return this.totalGamesPlayed > 0 ? this.totalScore / this.totalGamesPlayed : 0;
  }

  get progressToNextLevel(): number {
    const expForCurrentLevel = this.level * 1000;
    const expForNextLevel = (this.level + 1) * 1000;
    const currentLevelProgress = this.experience - expForCurrentLevel;
    const totalExpNeeded = expForNextLevel - expForCurrentLevel;
    return Math.min(100, (currentLevelProgress / totalExpNeeded) * 100);
  }

  // Methods
  addExperience(amount: number): void {
    this.experience += amount;
    const newLevel = Math.floor(this.experience / 1000) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
    }
  }

  updateWinRate(): void {
    const totalGames = this.totalWins + this.totalLosses;
    this.winRate = totalGames > 0 ? (this.totalWins / totalGames) * 100 : 0;
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
}