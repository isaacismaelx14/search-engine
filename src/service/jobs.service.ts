import { Jobs } from "@prisma/client";
import { DatabaseService } from "./database.service";
import { SearchService } from "./search.service";

export class JobsService extends DatabaseService {
  private searchService: SearchService;

  constructor() {
    super();
    this.searchService = new SearchService();
  }

  async getJobs() {
    return this.transaction(async () => {
      const jobs = await this.prisma.jobs.findMany();
      return jobs;
    });
  }

  async getJobById(id: number) {
    return this.transaction(async () => {
      const job = await this.prisma.jobs.findUnique({
        where: {
          id,
        },
      });
      return job;
    });
  }

  async createJob(data: Jobs) {
    return this.transaction(async () => {
      const simplifiedDescription = data.description
        .replace(/<[^>]*>/g, "")
        .toLowerCase();

      const combinedTexts =
        `Title: ${data.title}. Core Responsibilities: ${simplifiedDescription}. Skills: ${data.skills.join(",")} Company: ${data.company}. Location: ${data.location}, Sector: ${data.sector}`.toLowerCase();

      const embeddings = await this.searchService.generateEmbeddings<Jobs>({
        combinedTexts,
      });

      const job = await this.prisma.jobs.create({
        data: {
          ...data,
          embedding: embeddings[0].embedding,
        },
      });
      return job;
    });
  }

  async search({
    q,
    limit,
    page,
  }: {
    q: string;
    limit?: number;
    page?: number;
  }) {
    return this.transaction(async () => {
      const searched = await this.searchService.search<Jobs[]>({
        query: q,
        prisma: this.prisma,
        limit,
        from: "Jobs",
        page,
      });

      return searched.map((job) => ({ ...job, embedding: undefined }));
    });
  }
}
