import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Team } from "../entities/Team";
import { TeamMembership } from "../entities/TeamMembership";
import { GameSession } from "../entities/GameSession";
import { PlayerStats } from "../entities/PlayerStats";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "alliance_user",
  password: process.env.DB_PASSWORD || "alliance_password",
  database: process.env.DB_NAME || "alliance",
  synchronize: process.env.NODE_ENV !== "production", // Only sync in development
  logging: process.env.NODE_ENV === "development",
  entities: [User, Team, TeamMembership, GameSession, PlayerStats],
  migrations: ["src/database/migrations/*.ts"],
  subscribers: ["src/database/subscribers/*.ts"],
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  extra: {
    connectionLimit: 20,
    acquireTimeout: 60000,
    timeout: 60000,
  }
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ Database connection established successfully");
      
      // Run migrations in production
      if (process.env.NODE_ENV === "production") {
        await AppDataSource.runMigrations();
        console.log("✅ Database migrations completed");
      }
    }
  } catch (error) {
    console.error("❌ Error during Data Source initialization:", error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("✅ Database connection closed successfully");
    }
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
    throw error;
  }
};