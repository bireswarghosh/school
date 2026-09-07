const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_gO91MyoLsCkv@ep-super-voice-azabstqs-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });

async function seed() {
  const catCheck = await pool.query('SELECT id FROM course_categories LIMIT 1');
  let catId = catCheck.rows[0]?.id;
  if (!catId) {
    const catRes = await pool.query("INSERT INTO course_categories (name) VALUES ('General') RETURNING id");
    catId = catRes.rows[0].id;
  }

  await pool.query(
    `INSERT INTO courses (name, description, category_id, teacher_name, image_url, is_free, price, discount, school_id, created_at)
     VALUES
       ('Introduction to Mathematics', 'Learn the fundamentals of mathematics including algebra, geometry, and basic arithmetic. This course covers essential concepts for students of all levels with practical examples and exercises.', $1, 'Mrs. Anjali Deshmukh', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=250&fit=crop', true, 0, 0, 1, NOW()),
       ('Science Explorer', 'Discover the wonders of science through interactive lessons on physics, chemistry, and biology. Perfect for curious minds who want to understand the world around them.', $1, 'Mr. Rajesh Kumar', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=250&fit=crop', false, 299, 50, 1, NOW())
     ON CONFLICT DO NOTHING`,
    [catId]
  );

  console.log('2 demo courses added');
  await pool.end();
}
seed().catch(e => { console.error(e.message); process.exit(1); });
