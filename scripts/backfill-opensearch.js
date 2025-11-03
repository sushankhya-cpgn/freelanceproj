#!/usr/bin/env node
require('dotenv').config();

const path = require('path');
const { connectDB } = require(path.join(__dirname, '..', 'src', 'db', 'config', 'database'));
const { JobPost } = require(path.join(__dirname, '..', 'src', 'db'));
const searchService = require(path.join(__dirname, '..', 'src', 'services', 'search', 'opensearchService'));

(async () => {
  try {
    console.log('Connecting to DB...');
    await connectDB();

    console.log('Fetching jobs...');
    const jobs = await JobPost.findAll();
    console.log(`Found ${jobs.length} jobs. Indexing...`);

    let success = 0, failed = 0;
    for (const job of jobs) {
      try {
        await searchService.indexJob(job);
        success++;
      } catch (e) {
        failed++;
        console.warn('Index failed for job', job.id, e?.message);
      }
    }

    console.log(`Backfill complete. Success: ${success}, Failed: ${failed}`);
    process.exit(0);
  } catch (err) {
    console.error('Backfill error:', err);
    process.exit(1);
  }
})();
