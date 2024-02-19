import { Jobs } from ".prisma/client";
import { JobsService } from "../service/jobs.service";
import { Context } from "hono";

export class JobsController {
  private jobsService: JobsService;

  constructor() {
    this.jobsService = new JobsService();
  }

  async getJobs(context: Context) {
    const { q, limit, page } = context.req.query();

    if (q) {
      return context.json(
        await this.jobsService.search({
          q,
          limit: limit ? parseInt(limit) : undefined,
          page: page ? parseInt(page) : undefined,
        })
      );
    }

    const jobs = await this.jobsService.getJobs();
    return context.json(jobs.map((job) => ({ ...job, embedding: undefined })));
  }

  async getJobById(id: number) {
    return this.jobsService.getJobById(id);
  }

  async post(context: Context) {
    const data = await context.req.json<Jobs | Jobs[]>();

    if (Array.isArray(data)) {
      const jobs = await Promise.all(
        data.map((job) => this.jobsService.createJob(job))
      );

      return context.json(jobs, 201);
    }

    const job = await this.jobsService.createJob(data);
    return context.json(job, 201);
  }
}
