import { PrismaClient } from "@prisma/client";

export class DatabaseService {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  protected async disconnect() {
    await this.prisma.$disconnect();
  }

  protected async connect() {
    await this.prisma.$connect();
  }

  protected async transaction<T>(fn: () => Promise<T>) {
    await this.connect();
    const result = await fn();
    await this.disconnect();

    return result;
  }
}
