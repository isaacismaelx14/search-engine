import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { JobsController } from "./controllers/jobs.controller";

const PORT = process.env.PORT || 3000;
const app = new Hono();
const jobsController = new JobsController();

app.post("/api/jobs", jobsController.post.bind(jobsController));
app.get("/api/jobs", jobsController.getJobs.bind(jobsController));


app.use(
  "/*",
  serveStatic({
    root: "public",
    onNotFound: (_, c) => {
      c.status(404);
    },
  })
);


app.get(
  "*",
  serveStatic({
    path: "public/404.html",
  })
);


export default {
  port: PORT,
  fetch: app.fetch.bind(app),
};
