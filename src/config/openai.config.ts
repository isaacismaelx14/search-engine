import { EmbeddingCreateParams } from "openai/resources";

export const OpenAIConfig = {
    key: process.env.OPENAI_KEY,
    model: process.env.OPENAI_MODEL as EmbeddingCreateParams["model"] | undefined,
}