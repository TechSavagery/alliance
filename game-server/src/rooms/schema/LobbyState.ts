import { Schema, Context, type, MapSchema } from "@colyseus/schema";

export class TeamMember extends Schema {
  @type("string") id: string;
  @type("string") name: string = "";
  @type("string") teamId: string = "";
  @type("boolean") isReady: boolean = false;
  @type("number") joinedAt: number = Date.now();
}

export class GameSession extends Schema {
  @type("string") id: string;
  @type("string") teamId: string;
  @type("string") gameType: string = "";
  @type("number") scheduledTime: number = 0;
  @type("number") duration: number = 30; // minutes
  @type("boolean") isRecurring: boolean = false;
  @type("string") status: string = "scheduled"; // scheduled, active, completed, cancelled
  @type("number") createdAt: number = Date.now();
}

export class LobbyState extends Schema {
  @type({ map: TeamMember }) availablePlayers = new MapSchema<TeamMember>();
  @type({ map: LobbyState.Team }) teams = new MapSchema<LobbyState.Team>();
  @type({ map: GameSession }) scheduledSessions = new MapSchema<GameSession>();
  @type("number") totalPlayersOnline: number = 0;

  static Team = class Team extends Schema {
    @type("string") id: string;
    @type("string") name: string = "";
    @type("string") leaderId: string = "";
    @type("string") selectedGame: string = "";
    @type("boolean") isReady: boolean = false;
    @type({ map: TeamMember }) members = new MapSchema<TeamMember>();
    @type("number") createdAt: number = Date.now();
  }
}