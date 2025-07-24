import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './User';
import { GameSession } from './GameSession';

@Entity('player_stats')
@Unique(['userId', 'gameSessionId'])
export class PlayerStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  gameSessionId: string;

  @ManyToOne(() => User, user => user.gameStats)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => GameSession, session => session.playerStats)
  @JoinColumn({ name: 'gameSessionId' })
  gameSession: GameSession;

  @Column({ length: 50 })
  role: string;

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  kills: number;

  @Column({ default: 0 })
  deaths: number;

  @Column({ default: 0 })
  assists: number;

  @Column({ default: 0 })
  healsGiven: number;

  @Column({ default: 0 })
  healsReceived: number;

  @Column({ default: 0 })
  repairsPerformed: number;

  @Column({ default: 0 })
  accuracyPercentage: number;

  @Column({ default: 0 })
  shotsFired: number;

  @Column({ default: 0 })
  shotsHit: number;

  @Column({ default: 0 })
  damageDealt: number;

  @Column({ default: 0 })
  damageTaken: number;

  @Column({ default: 0 })
  distanceTraveled: number;

  @Column({ default: 0 })
  timeAlive: number; // in seconds

  @Column({ default: 0 })
  averageReactionTime: number; // in milliseconds

  @Column({ default: 0 })
  communicationCount: number;

  @Column({ default: 0 })
  leadershipActions: number;

  @Column({ default: 0 })
  teamworkActions: number;

  @Column({ default: 0 })
  adaptabilityScore: number;

  @Column({ type: 'json', nullable: true })
  roleSpecificStats: {
    // Gunner specific
    criticalHits?: number;
    headshots?: number;
    multiKills?: number;
    suppressionTime?: number;
    
    // Engineer specific
    structuresBuilt?: number;
    structuresRepaired?: number;
    resourcesGathered?: number;
    upgradesPerformed?: number;
    
    // Medic specific
    revives?: number;
    buffTimeProvided?: number;
    healthRestoredTotal?: number;
    emergencyHeals?: number;
  };

  @Column({ type: 'json', nullable: true })
  performanceBreakdown: {
    earlyGame: { score: number; performance: number };
    midGame: { score: number; performance: number };
    lateGame: { score: number; performance: number };
  };

  @Column({ type: 'json', nullable: true })
  heatmapData: {
    positions: { x: number; y: number; timestamp: Date }[];
    activityAreas: { x: number; y: number; radius: number; intensity: number }[];
  };

  @Column({ type: 'json', nullable: true })
  achievements: {
    id: string;
    name: string;
    description: string;
    unlockedAt: Date;
  }[];

  @Column({ type: 'json', nullable: true })
  skillRatings: {
    aim: number; // 1-100
    positioning: number; // 1-100
    teamwork: number; // 1-100
    communication: number; // 1-100
    adaptability: number; // 1-100
    leadership: number; // 1-100
    consistency: number; // 1-100
  };

  @Column({ type: 'json', nullable: true })
  milestones: {
    type: string;
    value: number;
    achievedAt: Date;
    description: string;
  }[];

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  mvpScore: number;

  @Column({ default: false })
  wasMVP: boolean;

  @Column({ default: 0 })
  contributionPercentage: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get killDeathRatio(): number {
    return this.deaths > 0 ? this.kills / this.deaths : this.kills;
  }

  get killDeathAssistRatio(): number {
    return this.deaths > 0 ? (this.kills + this.assists) / this.deaths : (this.kills + this.assists);
  }

  get accuracy(): number {
    return this.shotsFired > 0 ? (this.shotsHit / this.shotsFired) * 100 : 0;
  }

  get survivalRate(): number {
    return this.timeAlive > 0 ? (this.timeAlive / (this.timeAlive + this.deaths * 10)) * 100 : 0;
  }

  get overallPerformanceRating(): number {
    if (!this.skillRatings) return 0;
    
    const ratings = Object.values(this.skillRatings).filter(rating => rating > 0);
    return ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
  }

  get efficiencyScore(): number {
    // Calculate efficiency based on role
    let efficiency = 0;
    
    switch (this.role) {
      case 'gunner':
        efficiency = (this.kills * 20) + (this.accuracy * 2) + (this.damageDealt / 10);
        break;
      case 'engineer':
        const repairBonus = this.roleSpecificStats?.structuresRepaired || 0;
        const buildBonus = this.roleSpecificStats?.structuresBuilt || 0;
        efficiency = (repairBonus * 30) + (buildBonus * 40) + (this.score * 0.5);
        break;
      case 'medic':
        efficiency = (this.healsGiven * 25) + (this.roleSpecificStats?.revives || 0) * 50 + (this.teamworkActions * 10);
        break;
      default:
        efficiency = this.score;
    }
    
    return Math.round(efficiency);
  }

  get isTopPerformer(): boolean {
    return this.contributionPercentage >= 30 || this.wasMVP;
  }

  // Methods
  calculateMVPScore(): void {
    let score = 0;
    
    // Base score contribution
    score += this.score * 0.3;
    
    // Role-specific scoring
    switch (this.role) {
      case 'gunner':
        score += this.kills * 20;
        score += this.accuracy * 2;
        score += (this.roleSpecificStats?.criticalHits || 0) * 15;
        break;
      case 'engineer':
        score += this.repairsPerformed * 25;
        score += (this.roleSpecificStats?.structuresBuilt || 0) * 30;
        score += (this.roleSpecificStats?.upgradesPerformed || 0) * 20;
        break;
      case 'medic':
        score += this.healsGiven * 15;
        score += (this.roleSpecificStats?.revives || 0) * 40;
        score += this.teamworkActions * 10;
        break;
    }
    
    // Team contribution bonus
    score += this.teamworkActions * 5;
    score += this.communicationCount * 3;
    score += this.leadershipActions * 8;
    
    // Efficiency bonus
    score += this.efficiencyScore * 0.1;
    
    this.mvpScore = Math.round(score * 100) / 100;
  }

  calculateSkillRatings(): void {
    if (!this.skillRatings) {
      this.skillRatings = {
        aim: 0,
        positioning: 0,
        teamwork: 0,
        communication: 0,
        adaptability: 0,
        leadership: 0,
        consistency: 0
      };
    }

    // Calculate aim rating
    this.skillRatings.aim = Math.min(100, Math.max(1, 
      (this.accuracy * 0.7) + ((this.roleSpecificStats?.criticalHits || 0) * 5)
    ));

    // Calculate positioning (based on survival and damage taken ratio)
    const positioningScore = this.survivalRate + (this.damageDealt > 0 ? (this.damageDealt / (this.damageTaken + 1)) * 10 : 0);
    this.skillRatings.positioning = Math.min(100, Math.max(1, positioningScore));

    // Calculate teamwork rating
    this.skillRatings.teamwork = Math.min(100, Math.max(1, this.teamworkActions * 10));

    // Calculate communication rating
    this.skillRatings.communication = Math.min(100, Math.max(1, this.communicationCount * 8));

    // Calculate adaptability rating
    this.skillRatings.adaptability = Math.min(100, Math.max(1, this.adaptabilityScore));

    // Calculate leadership rating
    this.skillRatings.leadership = Math.min(100, Math.max(1, this.leadershipActions * 12));

    // Calculate consistency (based on performance variation throughout game)
    if (this.performanceBreakdown) {
      const performances = [
        this.performanceBreakdown.earlyGame.performance,
        this.performanceBreakdown.midGame.performance,
        this.performanceBreakdown.lateGame.performance
      ].filter(p => p > 0);
      
      if (performances.length > 1) {
        const avg = performances.reduce((sum, p) => sum + p, 0) / performances.length;
        const variance = performances.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / performances.length;
        this.skillRatings.consistency = Math.min(100, Math.max(1, 100 - (variance * 10)));
      }
    }
  }

  addAchievement(achievement: { id: string; name: string; description: string }): void {
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

  addMilestone(type: string, value: number, description: string): void {
    if (!this.milestones) {
      this.milestones = [];
    }
    
    this.milestones.push({
      type,
      value,
      achievedAt: new Date(),
      description
    });
  }

  updateHeatmap(x: number, y: number): void {
    if (!this.heatmapData) {
      this.heatmapData = {
        positions: [],
        activityAreas: []
      };
    }
    
    this.heatmapData.positions.push({
      x,
      y,
      timestamp: new Date()
    });
  }

  generatePerformanceSummary(): Record<string, any> {
    return {
      userId: this.userId,
      gameSessionId: this.gameSessionId,
      role: this.role,
      score: this.score,
      mvpScore: this.mvpScore,
      wasMVP: this.wasMVP,
      overallRating: this.overallPerformanceRating,
      efficiency: this.efficiencyScore,
      skillRatings: this.skillRatings,
      keyStats: {
        kdr: this.killDeathRatio,
        accuracy: this.accuracy,
        survivalRate: this.survivalRate,
        contributionPercentage: this.contributionPercentage
      },
      roleSpecific: this.roleSpecificStats,
      achievementsUnlocked: this.achievements?.length || 0
    };
  }
}