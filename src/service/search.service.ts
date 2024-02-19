import OpenAI from "openai";
import { OpenAIConfig } from "../config/openai.config";

import { EmbeddingCreateParams } from "openai/resources";
import { Prisma, PrismaClient } from "@prisma/client";

export class SearchService {
  private openai: OpenAI;
  private model: EmbeddingCreateParams["model"];

  constructor() {
    this.model = OpenAIConfig.model ?? "text-embedding-3-large";
    this.openai = new OpenAI({
      apiKey: OpenAIConfig.key,
    });
  }

  async generateEmbeddings<TData>(params: { combinedTexts: string }) {
    const { combinedTexts } = params;

    const embeddingsResponse = await this.openai.embeddings.create({
      model: this.model,
      input: combinedTexts,
    });

    const embeddingsData = embeddingsResponse.data.map((embedding) => ({
      embedding: embedding.embedding,
    }));

    return embeddingsData;
  }

  async search<TResponse>(params: {
    query: string;
    prisma: PrismaClient;
    limit?: number;
    from: string;
    page?: number;
  }) {
    const { query, prisma, from } = params;

    const queryEmbedding = await this.getEmbedding(query.toLowerCase(), prisma);

    const result = await prisma.$queryRaw<TResponse>`
      SELECT * ,
        (
          SELECT SUM(job_component * query_component)
          FROM UNNEST("embedding") WITH ORDINALITY AS job_emb(job_component, job_ord),
              UNNEST(ARRAY[${Prisma.raw(
                queryEmbedding.join(",")
              )}]::float[]) WITH ORDINALITY AS query_emb(query_component, query_ord)
          WHERE job_emb.job_ord = query_emb.query_ord
        ) AS similarity
      FROM ${Prisma.raw(`"${from}"`)}
      ORDER BY similarity DESC
      LIMIT ${params.limit ?? 10}
      OFFSET ${params.page ? (params.page - 1) * (params.limit ?? 10) : 0}
  `;

    return result;
  }

  private async getEmbedding(query: string, prisma: PrismaClient) {
    const cachedEmbedding = await prisma.searchCache.findFirst({
      where: {
        query,
      },
    });

    if (cachedEmbedding) {
      await prisma.searchCache.update({
        where: {
          id: cachedEmbedding.id,
        },
        data: {
          searchCount: cachedEmbedding.searchCount + 1,
        },
      });

      return cachedEmbedding.embedding;
    }

    const queryEmbeddingResponse = await this.openai.embeddings.create({
      model: this.model,
      input: query,
    });

    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

    await prisma.searchCache.create({
      data: {
        query,
        embedding: queryEmbedding,
        searchCount: 1,
      },
    });

    return queryEmbedding;
  }
}
