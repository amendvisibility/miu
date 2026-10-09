/**
 * Migration Script: Update Canonical URLs on Production MongoDB
 *
 * Usage:
 *   node scripts/update-prod-canonical.js "<YOUR_PROD_MONGODB_URI>"
 *
 * Or if MONGODB_URI is already in your environment / .env:
 *   node scripts/update-prod-canonical.js
 */

const mongoose = require('mongoose');

const uri = process.argv[2] || process.env.MONGODB_URI;

if (!uri) {
  console.error('\x1b[31mError: Please provide a MongoDB connection URI.\x1b[0m');
  console.log('Usage: node scripts/update-prod-canonical.js "<PROD_MONGODB_URI>"');
  process.exit(1);
}

async function runMigration() {
  console.log('\x1b[36mConnecting to MongoDB...\x1b[0m');
  await mongoose.connect(uri);
  console.log('\x1b[32mConnected successfully.\x1b[0m');

  const db = mongoose.connection.db;
  const coursesCol = db.collection('courses');

  // Find all courses with www.miu.edu.in in seo.canonicalUrl
  const matchingCourses = await coursesCol
    .find({ 'seo.canonicalUrl': /www\.miu\.edu\.in/ })
    .toArray();

  console.log(`Found ${matchingCourses.length} courses with "www.miu.edu.in" in canonicalUrl.`);

  if (matchingCourses.length === 0) {
    console.log('\x1b[32mAll course canonical URLs are already clean (non-www).\x1b[0m');
    await mongoose.disconnect();
    return;
  }

  let updatedCount = 0;
  for (const course of matchingCourses) {
    const oldUrl = course.seo?.canonicalUrl || '';
    const newUrl = oldUrl.replace('https://www.miu.edu.in', 'https://miu.edu.in');

    await coursesCol.updateOne(
      { _id: course._id },
      { $set: { 'seo.canonicalUrl': newUrl } }
    );

    console.log(`  Updated: ${course.title || course.slug} -> ${newUrl}`);
    updatedCount++;
  }

  console.log(`\n\x1b[32mSuccessfully updated ${updatedCount} courses to non-www canonical URLs.\x1b[0m`);
  await mongoose.disconnect();
  console.log('Database connection closed.');
}

runMigration().catch((err) => {
  console.error('\x1b[31mMigration failed:\x1b[0m', err);
  process.exit(1);
});
