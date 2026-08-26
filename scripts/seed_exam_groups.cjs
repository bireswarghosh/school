const { Pool } = require("pg")

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost/appstrice_school",
})

async function main() {
  const client = await pool.connect()
  try {
    // Insert groups (skip existing by name)
    const groupsToInsert = [
      ["Unit Test", "school_grade", "Short periodic assessments to evaluate student understanding of recent topics"],
      ["Mid Term", "school_grade", "Mid-term examinations covering half of the syllabus"],
      ["Final Exam", "general", "End-of-year comprehensive examinations"],
      ["Monthly Test", "college_grade", "Monthly assessment tests for continuous evaluation"],
      ["Practical Exam", "general", "Practical examination for skill-based subjects"],
      ["Half Yearly", "school_grade", "Half-yearly examinations covering first half of syllabus"],
    ]

    for (const [name, exam_type, description] of groupsToInsert) {
      const existing = await client.query("SELECT id FROM exam_groups WHERE name = $1", [name])
      if (existing.rows.length === 0) {
        await client.query(
          "INSERT INTO exam_groups (name, exam_type, description) VALUES ($1, $2, $3)",
          [name, exam_type, description]
        )
        console.log("+ Group:", name)
      } else {
        console.log("  Skipped (exists):", name)
      }
    }

    // Get all groups
    const groups = await client.query("SELECT id, name FROM exam_groups ORDER BY id")
    const groupMap = {}
    for (const g of groups.rows) {
      groupMap[g.name] = g.id
    }

    async function addExam(groupName, name, session, publishExam, publishResult, admitCard, passing, desc) {
      const gid = groupMap[groupName]
      if (!gid) { console.log("  Skipped - no group:", groupName); return }
      const existing = await client.query("SELECT id FROM exams WHERE name = $1 AND group_id = $2", [name, gid])
      if (existing.rows.length > 0) { console.log("  Exists:", name); return }
      await client.query(
        `INSERT INTO exams (group_id, name, session, publish_exam, publish_result, admit_card_roll_no, passing_percentage, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [gid, name, session, publishExam, publishResult, admitCard, passing, desc]
      )
      console.log("+ Exam:", name)
    }

    // Unit Test
    await addExam("Unit Test", "Unit Test 1", "2025-26", true, true, false, 33, "First unit test")
    await addExam("Unit Test", "Unit Test 2", "2025-26", true, true, false, 33, "Second unit test")
    await addExam("Unit Test", "Unit Test 3", "2025-26", false, false, false, 33, "Third unit test")

    // Mid Term
    await addExam("Mid Term", "Mid Term Examination", "2025-26", true, true, true, 35, "Mid-term examinations for all classes")

    // Final Exam
    await addExam("Final Exam", "Annual Examination", "2025-26", true, true, true, 33, "Final annual examination for promotion")
    await addExam("Final Exam", "Supplementary Examination", "2025-26", false, false, false, 33, "Supplementary exam for failed students")

    // Monthly Test
    await addExam("Monthly Test", "Monthly Test - April", "2025-26", true, true, false, 40, "April monthly assessment")
    await addExam("Monthly Test", "Monthly Test - July", "2025-26", true, true, false, 40, "July monthly assessment")
    await addExam("Monthly Test", "Monthly Test - September", "2025-26", true, false, false, 40, "September monthly assessment")

    // Practical Exam
    await addExam("Practical Exam", "Science Practical Exam", "2025-26", true, true, true, 33, "Science practical examination")
    await addExam("Practical Exam", "Computer Practical Exam", "2025-26", true, true, true, 33, "Computer science practical examination")

    // Half Yearly
    await addExam("Half Yearly", "Half Yearly Examination", "2025-26", true, true, true, 33, "Half-yearly examinations for all classes")

    // General Exam group
    await addExam("General Exam (Pass / Fail)", "General Assessment 1", "2025-26", true, true, false, 33, "General assessment")

    const totalGroups = await client.query("SELECT COUNT(*) FROM exam_groups")
    const totalExams = await client.query("SELECT COUNT(*) FROM exams")
    console.log("\nSummary: " + totalGroups.rows[0].count + " groups, " + totalExams.rows[0].count + " exams")
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
