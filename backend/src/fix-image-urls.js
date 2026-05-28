// fix-image-urls.js
// Run this ONCE from your backend/src folder
// Command: node fix-image-urls.js

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300/f97316/white?text=Food+Image';

async function fixImageUrls() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected!\n');

    const brokenItems = await MenuItem.find({
      imageUrl: { $regex: /^\/uploads\//i }
    });

    console.log(`🔍 Found ${brokenItems.length} items with broken image URLs`);

    if (brokenItems.length === 0) {
      console.log('✅ No broken URLs found. All good!');
      process.exit(0);
    }

    brokenItems.forEach(item => {
      console.log(`  - ${item.name}: ${item.imageUrl}`);
    });

    console.log(`\n🔧 Replacing all broken URLs with placeholder...`);

    const result = await MenuItem.updateMany(
      { imageUrl: { $regex: /^\/uploads\//i } },
      { $set: { imageUrl: PLACEHOLDER_IMAGE } }
    );

    console.log(`\n✅ Fixed ${result.modifiedCount} items!`);
    console.log('\n📝 Next step: Log into your admin panel and re-upload the real images.');
    console.log('   Once Cloudinary is set up, new uploads will save permanent URLs automatically.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

fixImageUrls();