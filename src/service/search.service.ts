import OpenAI from "openai";
import { OpenAIConfig } from "../config/openai.config";

import { EmbeddingCreateParams } from "openai/resources";

type ObjectWithId<T> = T & { id: string };
type EmbeddingData<IDType> = {
  id: IDType;
  embedding: number[];
};

export class SearchService {
  private openai: OpenAI;
  private model: EmbeddingCreateParams["model"];

  constructor() {
    this.model = OpenAIConfig.model ?? "text-embedding-3-small";
    this.openai = new OpenAI({
      apiKey: OpenAIConfig.key,
    });
  }

  async generateEmbeddings<TData>(params: {
    data: ObjectWithId<TData>[];
    combinedBy: {
      suffix?: string;
      prefix?: string;
      value: keyof TData;
    }[];
  }) {
    const { data, combinedBy } = params;
    if (data[0].id === undefined)
      throw new Error("Data must have an id property");

    const getCombinedText = (item: TData) => {
      const getValues = (combinedByItem) => {
        const value = item[combinedByItem.value];
        return `${combinedByItem.prefix ?? ""}${value}${
          combinedByItem.suffix ?? ""
        }`;
      };

      return combinedBy
        .map((combinedByItem) => getValues(combinedByItem))
        .join(" ")
        .trim();
    };

    const combinedTexts = data.map((item) => getCombinedText(item));

    const embeddingsResponse = await this.openai.embeddings.create({
      model: this.model,
      input: combinedTexts,
    });

    const embeddingsData = embeddingsResponse.data.map((embedding, index) => ({
      id: data[index].id,
      embedding: embedding.embedding,
    }));

    return embeddingsData;
  }

  async search<IDType>(params: {
    query: string;
    embeddings: EmbeddingData<IDType>[];
  }) {
    const { query, embeddings } = params;

    const queryEmbeddingResponse = await this.openai.embeddings.create({
      model: this.model,
      input: [query],
    });
    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

    const queryMagnitude = Math.sqrt(
      queryEmbedding.reduce((acc, value) => acc + value ** 2, 0)
    );

    const similarities = embeddings.map((data) => {
      const dotProduct = data.embedding.reduce(
        (acc, value, i) => acc + value * queryEmbedding[i],
        0
      );
      const dataMagnitude = Math.sqrt(
        data.embedding.reduce((acc, value) => acc + value ** 2, 0)
      );
      return {
        id: data.id,
        similarity: dotProduct / (dataMagnitude * queryMagnitude),
      };
    });

    return similarities;
  }
}
