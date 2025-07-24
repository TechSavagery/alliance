import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './User';
import { Team } from './Team';

export enum MembershipStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REMOVED = 'removed',
  LEFT = 'left'
}

export enum MembershipRole {
  LEADER = 'leader',
  CO_LEADER = 'co_leader',
  MEMBER = 'member'
}

@Entity('team_memberships')
@Unique(['userId', 'teamId'])
export class TeamMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  teamId: string;

  @ManyToOne(() => User, user => user.teamMemberships, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Team, team => team.memberships)
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column({
    type: 'enum',
    enum: MembershipRole,
    default: MembershipRole.MEMBER
  })
  role: MembershipRole;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.ACTIVE
  })
  status: MembershipStatus;

  @Column({ nullable: true })
  joinedAt: Date;

  @Column({ nullable: true })
  leftAt: Date;

  @Column({ default: 0 })
  gamesPlayedWithTeam: number;

  @Column({ default: 0 })
  totalScoreWithTeam: number;

  @Column({ default: 0 })
  winsWithTeam: number;

  @Column({ default: 0 })
  lossesWithTeam: number;

  @Column({ type: 'json', nullable: true })
  rolePreferences: {
    preferred: string[];
    avoided: string[];
  };

  @Column({ type: 'json', nullable: true })
  gameTypeStats: {
    [gameType: string]: {
      played: number;
      won: number;
      lost: number;
      totalScore: number;
      bestScore: number;
      averageScore: number;
      preferredRole: string;
    };
  };

  @Column({ type: 'json', nullable: true })
  performanceMetrics: {
    teamworkRating: number;
    communicationRating: number;
    leadershipRating: number;
    adaptabilityRating: number;
    consistencyRating: number;
  };

  @Column({ default: 0 })
  contributionScore: number;

  @Column({ type: 'json', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get winRateWithTeam(): number {
    const totalGames = this.winsWithTeam + this.lossesWithTeam;
    return totalGames > 0 ? (this.winsWithTeam / totalGames) * 100 : 0;
  }

  get averageScoreWithTeam(): number {
    return this.gamesPlayedWithTeam > 0 ? this.totalScoreWithTeam / this.gamesPlayedWithTeam : 0;
  }

  get overallPerformanceRating(): number {
    if (!this.performanceMetrics) return 0;
    
    const metrics = this.performanceMetrics;
    const ratings = [
      metrics.teamworkRating,
      metrics.communicationRating,
      metrics.leadershipRating,
      metrics.adaptabilityRating,
      metrics.consistencyRating
    ].filter(rating => rating > 0);
    
    return ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
  }

  get isActive(): boolean {
    return this.status === MembershipStatus.ACTIVE;
  }

  get isLeader(): boolean {
    return this.role === MembershipRole.LEADER;
  }

  get isCoLeader(): boolean {
    return this.role === MembershipRole.CO_LEADER;
  }

  get canManageTeam(): boolean {
    return this.isLeader || this.isCoLeader;
  }

  // Methods
  updateGameStats(gameType: string, won: boolean, score: number, role: string): void {
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
        averageScore: 0,
        preferredRole: role
      };
    }

    const stats = this.gameTypeStats[gameType];
    stats.played++;
    stats.totalScore += score;
    stats.preferredRole = role;
    
    if (won) {
      stats.won++;
      this.winsWithTeam++;
    } else {
      stats.lost++;
      this.lossesWithTeam++;
    }
    
    if (score > stats.bestScore) {
      stats.bestScore = score;
    }
    
    stats.averageScore = stats.totalScore / stats.played;
    
    this.gamesPlayedWithTeam++;
    this.totalScoreWithTeam += score;
  }

  updatePerformanceRating(metric: keyof TeamMembership['performanceMetrics'], rating: number): void {
    if (!this.performanceMetrics) {
      this.performanceMetrics = {
        teamworkRating: 0,
        communicationRating: 0,
        leadershipRating: 0,
        adaptabilityRating: 0,
        consistencyRating: 0
      };
    }
    
    // Ensure rating is between 1-10
    this.performanceMetrics[metric] = Math.max(1, Math.min(10, rating));
  }

  calculateContributionScore(): void {
    let score = 0;
    
    // Base contribution from games played
    score += this.gamesPlayedWithTeam * 10;
    
    // Win bonus
    score += this.winsWithTeam * 25;
    
    // Performance bonus
    score += this.overallPerformanceRating * 10;
    
    // Leadership bonus
    if (this.isLeader) {
      score += 200;
    } else if (this.isCoLeader) {
      score += 100;
    }
    
    this.contributionScore = Math.round(score);
  }

  promote(): boolean {
    if (this.role === MembershipRole.MEMBER) {
      this.role = MembershipRole.CO_LEADER;
      return true;
    } else if (this.role === MembershipRole.CO_LEADER) {
      this.role = MembershipRole.LEADER;
      return true;
    }
    return false;
  }

  demote(): boolean {
    if (this.role === MembershipRole.LEADER) {
      this.role = MembershipRole.CO_LEADER;
      return true;
    } else if (this.role === MembershipRole.CO_LEADER) {
      this.role = MembershipRole.MEMBER;
      return true;
    }
    return false;
  }

  leave(): void {
    this.status = MembershipStatus.LEFT;
    this.leftAt = new Date();
  }

  remove(): void {
    this.status = MembershipStatus.REMOVED;
    this.leftAt = new Date();
  }

  reactivate(): void {
    this.status = MembershipStatus.ACTIVE;
    this.leftAt = null;
    if (!this.joinedAt) {
      this.joinedAt = new Date();
    }
  }
}