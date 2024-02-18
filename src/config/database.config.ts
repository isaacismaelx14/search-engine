const port = process.env.DB_PORT || "5432";

export const DatabaseConfig = {
    host: process.env.DB_HOST,
    port: parseInt(port),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
}