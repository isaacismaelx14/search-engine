import { DatabaseConfig } from "./../config/database.config";
import postgres from "postgres";

export class Database {
  private static db: postgres.Sql<{}>;

  static async query(query: string) {
    await this.open();
    const result = await this.db`${query}`;
    await this.close();

    return result;
  }

  static async open() {
    this.db = postgres({
      ...DatabaseConfig,
    });
  }

  static async close() {
    await this.db.end();
  }
}
