'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const ALLOWED_CATEGORIES = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Tin học', 'Mỹ thuật', 'Âm nhạc'];
const ALLOWED_LEVELS = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];
const ALLOWED_VIS = ['public', 'private'];
const ALLOWED_STATUS = ['draft', 'published', 'archived'];

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String,
});

const courseSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: false },
  description: String,
  thumbnail: String,
  tags: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visibility: String,
  status: String,
  category: String,
  level: String,
}, { timestamps: true, strict: false });

const User = mongoose.model('User', userSchema, 'users');
const Course = mongoose.model('Course', courseSchema, 'courses');

function slugify(input) {
  return (input || '')
    .toString()
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function ensureUniqueSlug(base) {
  let slug = base || 'khoa-hoc';
  let unique = slug;
  let i = 1;
  // Loop until unique
  while (await Course.exists({ slug: unique })) {
    unique = `${slug}-${i++}`;
  }
  return unique;
}

function getArg(name) {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  const kv = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (kv) return kv.split('=')[1];
  return undefined;
}

async function run() {
  const cliUri = getArg('uri');
  const uri = cliUri || process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || process.env.MONGO_URL || process.env.DATABASE_URL || 'mongodb://localhost:27017/eduplatform';
  console.log('Connecting to MongoDB:', uri.replace(/:\/\/[\w-]+:(.*?)@/, '://***:***@'));
  await mongoose.connect(uri, { autoIndex: false });

  try {
    const teachers = await User.find({ role: 'teacher' }).select('_id name email').lean();
    if (!teachers.length) {
      throw new Error('Không có giảng viên nào trong hệ thống. Hãy tạo ít nhất 1 teacher trước.');
    }
    const defaultTeacherId = teachers[0]._id;

    const courses = await Course.find({}).lean();
    console.log(`Found ${courses.length} courses`);

    let updated = 0;
    for (const c of courses) {
      const update = {};

      // createdBy must be a teacher
      if (!c.createdBy) {
        update.createdBy = defaultTeacherId;
      } else {
        const owner = await User.findById(c.createdBy).lean();
        if (!owner || owner.role !== 'teacher') {
          update.createdBy = defaultTeacherId;
        }
      }

      // visibility/status normalization
      if (!ALLOWED_VIS.includes(c.visibility)) {
        update.visibility = 'public';
      }
      if (!ALLOWED_STATUS.includes(c.status)) {
        update.status = 'published';
      }

      // category/level to primary-school set
      if (!ALLOWED_CATEGORIES.includes(c.category)) {
        // simple heuristic mapping by title keywords
        const title = (c.title || '').toLowerCase();
        if (title.includes('toan') || title.includes('math')) update.category = 'Toán';
        else if (title.includes('tieng viet') || title.includes('vietnamese')) update.category = 'Tiếng Việt';
        else if (title.includes('english') || title.includes('anh')) update.category = 'Tiếng Anh';
        else if (title.includes('khoa hoc') || title.includes('science')) update.category = 'Khoa học';
        else if (title.includes('tin hoc') || title.includes('informatic') || title.includes('computer')) update.category = 'Tin học';
        else if (title.includes('my thuat') || title.includes('art')) update.category = 'Mỹ thuật';
        else if (title.includes('am nhac') || title.includes('music')) update.category = 'Âm nhạc';
        else update.category = 'Toán';
      }

      if (!ALLOWED_LEVELS.includes(c.level)) {
        // detect a grade number in title
        const match = (c.title || '').match(/\blop\s*(1|2|3|4|5)\b|\bgrade\s*(1|2|3|4|5)\b/i);
        const num = match ? (match[1] || match[2]) : null;
        update.level = num ? `Lớp ${num}` : 'Lớp 1';
      }

      // slug
      let baseSlug = c.slug && typeof c.slug === 'string' && c.slug.trim() ? c.slug : slugify(c.title);
      if (!baseSlug) baseSlug = 'khoa-hoc';
      // If slug used by another doc (not self), regenerate unique
      const existsOther = await Course.findOne({ slug: baseSlug, _id: { $ne: c._id } }).select('_id').lean();
      if (existsOther) {
        update.slug = await ensureUniqueSlug(baseSlug);
      } else if (!c.slug) {
        update.slug = await ensureUniqueSlug(baseSlug);
      }

      if (Object.keys(update).length) {
        await Course.updateOne({ _id: c._id }, { $set: update });
        updated++;
        console.log(`Updated course ${c._id}:`, update);
      }
    }

    console.log(`Done. Updated ${updated}/${courses.length} courses.`);
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();


