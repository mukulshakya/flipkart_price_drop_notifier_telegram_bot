const Bull = require("bull");
const processSubscription = require("./processSubscription");

const subscriptionQueue = new Bull("subscriptionQueue", {
  limiter: { max: 50, duration: 1000 },
});

const CONCURRENT_JOBS_COUNT = 10;
const PREVIOUS_JOB_STATES_TO_BE_CLEANED = [
  "active",
  "completed",
  "failed",
  "wait",
  "delayed",
];

module.exports = async (bot, db) => {
  try {
    // const active = await subscriptionQueue.clean(10, "active");
    // const completed = await subscriptionQueue.clean(10, "completed");
    // const failed = await subscriptionQueue.clean(10, "failed");
    // const waiting = await subscriptionQueue.clean(10, "wait");
    // const delayed = await subscriptionQueue.clean(10, "delayed");
    // console.log(active, completed, failed, waiting, delayed);

    for (const state of PREVIOUS_JOB_STATES_TO_BE_CLEANED) {
      const res = await subscriptionQueue.clean(1, state);
      console.log(state, res);
    }

    const subscriptions = await db.Subscription.find();
    // Add all jobs to be processed
    for (const subscription of subscriptions) {
      //   console.log(subscription.title);
      // repeat after every 5 minutes: 5 minutes = 300000 ms
      const job = await subscriptionQueue.add(
        { id: subscription.id, title: subscription.title },
        { jobId: subscription._id, repeat: { every: 60000 } }
      );
      subscription.jobId = job.id;
      await subscription.save();
    }

    // subscriptionQueue
    //   .getJobs()
    //   //   .getJobCounts()
    //   .then((jobs) =>
    //     jobs.forEach(async (job) => {
    //       console.log(job.ke);
    //       //   job
    //       //     .getState()
    //       //     .then((state) =>
    //       //       console.log(job.data.subscription?.title || "", "----", state)
    //       //     );
    //     })
    //   );

    // subscriptionQueue.getJob(subscriptions[0].jobId).then((job) => {
    //   console.log(job.key);
    // });

    // Start running jobs
    subscriptionQueue.process(CONCURRENT_JOBS_COUNT, (job, done) =>
      processSubscription(job, bot, db, done)
    );

    // Job execution `Success` & `Error` event handlers
    subscriptionQueue.on("completed", (job, result) => {
      console.log(
        `COMPLETED - Job ${job.id} for product: ${JSON.stringify(result, 0, 2)}`
      );
    });
    subscriptionQueue.on("failed", (job, error) => {
      console.log(`FAILED - Job`, job.id, error);
    });
  } catch (e) {
    console.log("Loop after job sent for processing:", e);
  } finally {
    return subscriptionQueue;
  }
};
