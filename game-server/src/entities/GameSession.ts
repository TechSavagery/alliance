import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinColumn, JoinTable, OneToMany } from 'typeorm';
import { User } from './User';
import { Team } from './Team';
import { PlayerStats } from './PlayerStats';

export enum GameStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ABANDONED = 'abandoned'
}

export enum GameResult {
  WIN = 'win',
  LOSS = 'loss',
  DRAW = 'draw',
  ABANDONED = 'abandoned'
}

@Entity('game_sessions')
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  sessionCode: string;

  @Column({ length: 50 })
  gameType: string;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.SCHEDULED
  })
  status: GameStatus;

  @Column({
    type: 'enum',
    enum: GameResult,
    nullable: true
  })
  result: GameResult;

  @Column('uuid', { nullable: true })
  teamId: string;

  @ManyToOne(() => Team, team => team.gameSessions)
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @ManyToMany(() => User, user => user.gameSessions)
  @JoinTable({
    name: 'game_session_players',
    joinColumn: { name: 'sessionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' }
  })
  players: User[];

  @OneToMany(() => PlayerStats, stats => stats.gameSession)
  playerStats: PlayerStats[];

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @Column({ default: 30 })
  plannedDurationMinutes: number;

  @Column({ nullable: true })
  actualDurationMinutes: number;

  @Column({ default: 0 })
  teamScore: number;

  @Column({ default: 0 })
  maxPossibleScore: number;

  @Column({ default: 1 })
  difficultyLevel: number;

  @Column({ default: 1 })
  waveNumber: number;

  @Column({ type: 'json', nullable: true })
  gameConfig: {
    maxPlayers: number;
    gameSpeed: number;
    enemySpawnRate: number;
    difficultyScaling: number;
    allowedRoles: string[];
    customRules?: Record<string, any>;
  };

  @Column({ type: 'json', nullable: true })
  sessionEvents: {
    timestamp: Date;
    type: string;
    playerId?: string;
    details: Record<string, any>;
  }[];

  @Column({ type: 'json', nullable: true })
  performanceMetrics: {
    averageReactionTime: number;
    teamworkScore: number;
    communicationScore: number;
    leadershipMoments: number;
    adaptabilityScore: number;
    overallRating: number;
  };

  @Column({ type: 'json', nullable: true })
  achievements: {
    playerId: string;
    achievementId: string;
    unlockedAt: Date;
  }[];

  @Column({ type: 'json', nullable: true })
  feedback: {
    playerId: string;
    rating: number;
    comment?: string;
    submittedAt: Date;
  }[];

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurringScheduleId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get duration(): number {
    if (this.startedAt && this.endedAt) {
      return Math.round((this.endedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
    }
    return 0;
  }

  get isCompleted(): boolean {
    return this.status === GameStatus.COMPLETED;
  }

  get isInProgress(): boolean {
    return this.status === GameStatus.IN_PROGRESS;
  }

  get playerCount(): number {
    return this.players?.length || 0;
  }

  get successRate(): number {
    if (this.maxPossibleScore === 0) return 0;
    return (this.teamScore / this.maxPossibleScore) * 100;
  }

  get averagePlayerRating(): number {
    if (!this.feedback || this.feedback.length === 0) return 0;
    const totalRating = this.feedback.reduce((sum, f) => sum + f.rating, 0);
    return totalRating / this.feedback.length;
  }

  get wasSuccessful(): boolean {
    return this.result === GameResult.WIN;
  }

  // Methods
  start(): void {
    this.status = GameStatus.IN_PROGRESS;
    this.startedAt = new Date();
  }

  complete(result: GameResult, finalScore: number): void {
    this.status = GameStatus.COMPLETED;
    this.endedAt = new Date();
    this.result = result;
    this.teamScore = finalScore;
    this.actualDurationMinutes = this.duration;
  }

  cancel(reason?: string): void {
    this.status = GameStatus.CANCELLED;
    this.endedAt = new Date();
    if (reason) {
      this.notes = (this.notes || '') + `\nCancellation reason: ${reason}`;
    }
  }

  abandon(reason?: string): void {
    this.status = GameStatus.ABANDONED;
    this.result = GameResult.ABANDONED;
    this.endedAt = new Date();
    if (reason) {
      this.notes = (this.notes || '') + `\nAbandoned: ${reason}`;
    }
  }

  addEvent(type: string, playerId?: string, details: Record<string, any> = {}): void {
    if (!this.sessionEvents) {
      this.sessionEvents = [];
    }

    this.sessionEvents.push({
      timestamp: new Date(),
      type,
      playerId,
      details
    });
  }

  addPlayerFeedback(playerId: string, rating: number, comment?: string): void {
    if (!this.feedback) {
      this.feedback = [];
    }

    // Remove existing feedback from this player
    this.feedback = this.feedback.filter(f => f.playerId !== playerId);

    // Add new feedback
    this.feedback.push({
      playerId,
      rating: Math.max(1, Math.min(10, rating)), // Ensure rating is 1-10
      comment,
      submittedAt: new Date()
    });
  }

  unlockAchievement(playerId: string, achievementId: string): void {
    if (!this.achievements) {
      this.achievements = [];
    }

    // Check if achievement already unlocked
    const exists = this.achievements.find(a => a.playerId === playerId && a.achievementId === achievementId);
    if (!exists) {
      this.achievements.push({
        playerId,
        achievementId,
        unlockedAt: new Date()
      });
    }
  }

  calculatePerformanceMetrics(): void {
    if (!this.sessionEvents || this.sessionEvents.length === 0) return;

    // Calculate various performance metrics based on session events
    const metrics = {
      averageReactionTime: 0,
      teamworkScore: 0,
      communicationScore: 0,
      leadershipMoments: 0,
      adaptabilityScore: 0,
      overallRating: 0
    };

    // Analyze events to calculate metrics
    const reactionTimes: number[] = [];
    let teamworkEvents = 0;
    let communicationEvents = 0;
    let leadershipEvents = 0;
    let adaptabilityEvents = 0;

    this.sessionEvents.forEach(event => {
      switch (event.type) {
        case 'player_action':
          if (event.details.reactionTime) {
            reactionTimes.push(event.details.reactionTime);
          }
          break;
        case 'teamwork':
          teamworkEvents++;
          break;
        case 'communication':
          communicationEvents++;
          break;
        case 'leadership':
          leadershipEvents++;
          break;
        case 'adaptation':
          adaptabilityEvents++;
          break;
      }
    });

    // Calculate metrics
    if (reactionTimes.length > 0) {
      metrics.averageReactionTime = reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length;
    }

    metrics.teamworkScore = Math.min(100, teamworkEvents * 10);
    metrics.communicationScore = Math.min(100, communicationEvents * 15);
    metrics.leadershipMoments = leadershipEvents;
    metrics.adaptabilityScore = Math.min(100, adaptabilityEvents * 20);

    // Calculate overall rating
    metrics.overallRating = Math.round(
      (metrics.teamworkScore + metrics.communicationScore + metrics.adaptabilityScore) / 3
    );

    this.performanceMetrics = metrics;
  }

  getPlayerStats(playerId: string): PlayerStats | undefined {
    return this.playerStats?.find(stats => stats.userId === playerId);
  }

  generateSessionSummary(): Record<string, any> {
    return {
      sessionId: this.id,
      gameType: this.gameType,
      duration: this.duration,
      playerCount: this.playerCount,
      teamScore: this.teamScore,
      successRate: this.successRate,
      result: this.result,
      averageRating: this.averagePlayerRating,
      performanceMetrics: this.performanceMetrics,
      achievementsUnlocked: this.achievements?.length || 0,
      completedAt: this.endedAt
    };
  }
}