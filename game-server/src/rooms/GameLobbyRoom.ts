import { Room, Client } from "colyseus";
import { LobbyState, TeamMember, GameSession } from "./schema/LobbyState";

export class GameLobbyRoom extends Room<LobbyState> {
  private maxClients = 12; // Allow multiple teams
  
  onCreate(options: any) {
    this.setState(new LobbyState());
    this.setMaxClients(this.maxClients);

    // Handle team formation
    this.onMessage("joinTeam", (client, message) => {
      this.handleJoinTeam(client, message.teamName, message.playerName);
    });

    this.onMessage("createTeam", (client, message) => {
      this.handleCreateTeam(client, message.teamName, message.playerName);
    });

    this.onMessage("selectGame", (client, message) => {
      this.handleGameSelection(client, message.gameType);
    });

    this.onMessage("startGame", (client, message) => {
      this.handleStartGame(client);
    });

    this.onMessage("scheduleSession", (client, message) => {
      this.handleScheduleSession(client, message);
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined lobby!");
    
    const member = new TeamMember();
    member.id = client.sessionId;
    member.name = options.playerName || `Player${client.sessionId.slice(0, 6)}`;
    member.isReady = false;
    
    this.state.availablePlayers.set(client.sessionId, member);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left lobby!");
    
    // Remove from available players
    this.state.availablePlayers.delete(client.sessionId);
    
    // Remove from any team
    this.state.teams.forEach((team, teamId) => {
      if (team.members.has(client.sessionId)) {
        team.members.delete(client.sessionId);
        if (team.members.size === 0) {
          this.state.teams.delete(teamId);
        }
      }
    });
  }

  onDispose() {
    console.log("lobby", this.roomId, "disposing...");
  }

  private handleJoinTeam(client: Client, teamName: string, playerName: string) {
    const team = this.state.teams.get(teamName);
    const player = this.state.availablePlayers.get(client.sessionId);
    
    if (team && player && team.members.size < 4) {
      player.name = playerName;
      player.teamId = teamName;
      team.members.set(client.sessionId, player);
      this.state.availablePlayers.delete(client.sessionId);
      
      this.broadcast("teamUpdated", {
        teamName,
        members: Array.from(team.members.values())
      });
    }
  }

  private handleCreateTeam(client: Client, teamName: string, playerName: string) {
    if (!this.state.teams.has(teamName)) {
      const team = new LobbyState.Team();
      team.id = teamName;
      team.name = teamName;
      team.leaderId = client.sessionId;
      team.selectedGame = "";
      team.isReady = false;
      
      this.state.teams.set(teamName, team);
      
      // Add creator to team
      this.handleJoinTeam(client, teamName, playerName);
    }
  }

  private handleGameSelection(client: Client, gameType: string) {
    // Find client's team
    this.state.teams.forEach((team, teamId) => {
      if (team.leaderId === client.sessionId) {
        team.selectedGame = gameType;
        this.broadcast("gameSelected", { teamId, gameType });
      }
    });
  }

  private async handleStartGame(client: Client) {
    // Find client's team
    this.state.teams.forEach(async (team, teamId) => {
      if (team.leaderId === client.sessionId && team.selectedGame && team.members.size >= 2) {
        // Create game room based on selected game
        const gameRoomName = this.getGameRoomName(team.selectedGame);
        
        try {
          const gameRoom = await this.presence.create(gameRoomName, {
            teamId: teamId,
            players: Array.from(team.members.values())
          });
          
          // Notify team members of the game room
          team.members.forEach((member, memberId) => {
            this.send(memberId, "gameRoomCreated", {
              roomId: gameRoom.roomId,
              gameType: team.selectedGame
            });
          });
          
        } catch (error) {
          console.error("Failed to create game room:", error);
          this.send(client, "error", { message: "Failed to start game" });
        }
      }
    });
  }

  private handleScheduleSession(client: Client, sessionData: any) {
    const session = new GameSession();
    session.id = `session_${Date.now()}`;
    session.teamId = sessionData.teamId;
    session.scheduledTime = sessionData.scheduledTime;
    session.duration = sessionData.duration || 30; // default 30 minutes
    session.gameType = sessionData.gameType;
    session.isRecurring = sessionData.isRecurring || false;
    session.status = "scheduled";
    
    this.state.scheduledSessions.set(session.id, session);
    
    this.broadcast("sessionScheduled", {
      session: session,
      teamId: sessionData.teamId
    });
  }

  private getGameRoomName(gameType: string): string {
    switch (gameType) {
      case "shooter":
        return "shooter_game";
      case "puzzle":
        return "puzzle_game";
      case "strategy":
        return "strategy_game";
      default:
        return "shooter_game";
    }
  }
}