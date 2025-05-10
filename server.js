const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { setupCronJobs } = require("./lib/utils/cron-jobs")

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Set up cron jobs
  const cronJobs = setupCronJobs()
  console.log(`Started ${cronJobs.jobs.length} cron jobs successfully`)

  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(3000, (err) => {
    if (err) throw err
    console.log("> Ready on http://localhost:3000")
  })

  // Cleanup function for graceful shutdown
  const cleanup = () => {
    console.log("Cleaning up cron jobs before shutdown...")
    if (cronJobs.intervals) {
      cronJobs.intervals.forEach((interval) => clearInterval(interval))
    }
    process.exit(0)
  }

  // Handle graceful shutdown
  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)
})
