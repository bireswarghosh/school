// Seed the EXACT school uniform price lists from the reference images.
// Blue Uniform + Brown Uniform — 17 components, 15 sizes each.
// All prices are exactly as specified. Blank cells are omitted (NULL).

const { Pool } = require("pg")

const pool = new Pool({ connectionString: "postgresql://postgres:123@localhost/appstrice_school" })

const DEFAULT_SCHOOL_ID = 1

async function main() {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // ---- Wipe existing demo variable products (cascades to children) ----
    const wipeSql = `
      DELETE FROM si_vp_price_history WHERE product_id IN (SELECT id FROM si_vp_products WHERE name LIKE 'School Uniform%');
      DELETE FROM si_vp_prices WHERE product_id IN (SELECT id FROM si_vp_products WHERE name LIKE 'School Uniform%');
      DELETE FROM si_vp_variants WHERE product_id IN (SELECT id FROM si_vp_products WHERE name LIKE 'School Uniform%');
      DELETE FROM si_vp_components WHERE product_id IN (SELECT id FROM si_vp_products WHERE name LIKE 'School Uniform%');
      DELETE FROM si_vp_groups WHERE product_id IN (SELECT id FROM si_vp_products WHERE name LIKE 'School Uniform%');
      DELETE FROM si_vp_products WHERE name LIKE 'School Uniform%';
    `
    const stmts = wipeSql.trim().split(';\n').map((s) => s.trim()).filter(Boolean)
    for (const s of stmts) await client.query(s)

    // ================================================================
    // BLUE UNIFORM
    // ================================================================
    const blueRes = await client.query(`
      INSERT INTO si_vp_products (school_id, name, code, academic_year, status)
      VALUES ($1, 'School Uniform - Blue', 'SU-BLUE', '2026-27', 'Active')
      RETURNING id`, [DEFAULT_SCHOOL_ID])
    const blueProductId = blueRes.rows[0].id

    await client.query(`
      INSERT INTO si_vp_groups (school_id, product_id, name, display_order) VALUES
        ($1, $2, 'UNIFORM', 1), ($1, $2, 'SPORTS', 2), ($1, $2, 'ACCESSORIES', 3)`,
      [DEFAULT_SCHOOL_ID, blueProductId])

    const blueGroupsRes = await client.query(`SELECT id, name FROM si_vp_groups WHERE product_id = $1`, [blueProductId])
    const blueGid = Object.fromEntries(blueGroupsRes.rows.map((r) => [r.name, r.id]))

    const blueComponents = [
      // UNIFORM group
      { name: 'Boys Half Pant Blue', shortName: 'Boys Half Pant', group: 'UNIFORM', sizeDependent: true },
      { name: 'Boys Half Shirt Blue', shortName: 'Boys Half Shirt', group: 'UNIFORM', sizeDependent: true },
      { name: 'Girls Skirt Blue', shortName: 'Girls Skirt', group: 'UNIFORM', sizeDependent: true },
      { name: 'Girls Half Shirt Blue', shortName: 'Girls Half Shirt', group: 'UNIFORM', sizeDependent: true },
      { name: 'Boys & Girls Full Pant Blue', shortName: 'Full Pant', group: 'UNIFORM', sizeDependent: true },
      { name: 'Boys & Girls Full Shirt Blue', shortName: 'Full Shirt', group: 'UNIFORM', sizeDependent: true },
      { name: 'Pullovers Boys & Girls', shortName: 'Pullover', group: 'UNIFORM', sizeDependent: true },
      { name: 'Cap Boys & Girls', shortName: 'Cap', group: 'UNIFORM', sizeDependent: true },
      { name: 'Blazer', shortName: 'Blazer', group: 'UNIFORM', sizeDependent: true },
      // SPORTS group
      { name: 'Sports Track Pant', shortName: 'Track Pant', group: 'SPORTS', sizeDependent: true },
      { name: 'Sports T-Shirt', shortName: 'T-Shirt', group: 'SPORTS', sizeDependent: true },
      // ACCESSORIES group
      { name: 'Bag', shortName: 'Bag', group: 'ACCESSORIES', sizeDependent: false },
      { name: 'Belt', shortName: 'Belt', group: 'ACCESSORIES', sizeDependent: false },
      { name: 'I Card Holder', shortName: 'ID Card Holder', group: 'ACCESSORIES', sizeDependent: false },
      { name: 'I Card', shortName: 'ID Card', group: 'ACCESSORIES', sizeDependent: false },
      { name: 'Diary', shortName: 'Diary', group: 'ACCESSORIES', sizeDependent: false },
      { name: 'Tie', shortName: 'Tie', group: 'ACCESSORIES', sizeDependent: false },
    ]

    let bOrd = 1
    const blueCompIdMap = {}
    for (const comp of blueComponents) {
      const r = await client.query(
        `INSERT INTO si_vp_components (school_id, product_id, group_id, name, short_name, size_dependent, display_order, is_active)
         VALUES ($1::int, $2::int, (SELECT id FROM si_vp_groups WHERE product_id = $2 AND name = $3), $4, $5, $6::boolean, $7::int, true) RETURNING id`,
        [DEFAULT_SCHOOL_ID, blueProductId, comp.group, comp.name, comp.shortName || comp.name, comp.sizeDependent, bOrd++]
      )
      blueCompIdMap[comp.name] = r.rows[0].id
    }

    // Variants
    const variants = [
      { name: '20' }, { name: '22' }, { name: '24' }, { name: '26' }, { name: '28' },
      { name: '30' }, { name: '32' }, { name: '34' }, { name: '36' }, { name: '38' },
      { name: '40' }, { name: '42' }, { name: '44' }, { name: 'S' }, { name: 'L' }, { name: 'XL' },
    ]
    const blueVarIdMap = {}
    for (const v of variants) {
      const r = await client.query(
        `INSERT INTO si_vp_variants (school_id, product_id, name, is_active, display_order)
         VALUES ($1::int, $2::int, $3, true, $4::int) RETURNING id`,
        [DEFAULT_SCHOOL_ID, blueProductId, v.name, variants.indexOf(v) + 1]
      )
      blueVarIdMap[v.name] = r.rows[0].id
    }

    // Prices (component name, size name, price) — exactly as specified
    const bluePrices = [
      // SIZE 20
      ['Boys Half Pant Blue', '20', 350], ['Boys Half Shirt Blue', '20', 350], ['Girls Skirt Blue', '20', 425],
      ['Girls Half Shirt Blue', '20', 350], ['Boys & Girls Full Pant Blue', '20', 430],
      ['Boys & Girls Full Shirt Blue', '20', 400], ['Pullovers Boys & Girls', '20', 550],
      ['Cap Boys & Girls', '20', 150], ['Belt', '20', 100], ['I Card Holder', '20', 150],
      ['I Card', '20', 100], ['Diary', '20', 200], ['Tie', '20', 100],
      // SIZE 22
      ['Boys Half Pant Blue', '22', 425], ['Boys Half Shirt Blue', '22', 375], ['Girls Skirt Blue', '22', 450],
      ['Girls Half Shirt Blue', '22', 375], ['Boys & Girls Full Pant Blue', '22', 440],
      ['Boys & Girls Full Shirt Blue', '22', 400], ['Pullovers Boys & Girls', '22', 550], ['Belt', '22', 100],
      // SIZE 24
      ['Boys Half Pant Blue', '24', 450], ['Boys Half Shirt Blue', '24', 400], ['Girls Skirt Blue', '24', 475],
      ['Girls Half Shirt Blue', '24', 400], ['Boys & Girls Full Pant Blue', '24', 480],
      ['Boys & Girls Full Shirt Blue', '24', 430], ['Pullovers Boys & Girls', '24', 550],
      ['Sports Track Pant', '24', 270], ['Sports T-Shirt', '24', 360], ['Belt', '24', 100],
      // SIZE 26
      ['Boys Half Pant Blue', '26', 475], ['Boys Half Shirt Blue', '26', 425], ['Girls Skirt Blue', '26', 500],
      ['Girls Half Shirt Blue', '26', 400], ['Boys & Girls Full Pant Blue', '26', 490],
      ['Boys & Girls Full Shirt Blue', '26', 435], ['Pullovers Boys & Girls', '26', 550],
      ['Sports Track Pant', '26', 280], ['Sports T-Shirt', '26', 370], ['Belt', '26', 110],
      // SIZE 28
      ['Boys Half Pant Blue', '28', 475], ['Boys Half Shirt Blue', '28', 450], ['Girls Skirt Blue', '28', 500],
      ['Girls Half Shirt Blue', '28', 425], ['Boys & Girls Full Pant Blue', '28', 500],
      ['Boys & Girls Full Shirt Blue', '28', 470], ['Pullovers Boys & Girls', '28', 550],
      ['Sports Track Pant', '28', 290], ['Sports T-Shirt', '28', 380], ['Belt', '28', 110],
      // SIZE 30
      ['Boys Half Pant Blue', '30', 500], ['Boys Half Shirt Blue', '30', 450], ['Girls Skirt Blue', '30', 500],
      ['Girls Half Shirt Blue', '30', 450], ['Boys & Girls Full Pant Blue', '30', 520],
      ['Boys & Girls Full Shirt Blue', '30', 470], ['Pullovers Boys & Girls', '30', 575],
      ['Sports Track Pant', '30', 310], ['Sports T-Shirt', '30', 390], ['Belt', '30', 110],
      // SIZE 32
      ['Boys Half Pant Blue', '32', 500], ['Boys Half Shirt Blue', '32', 460], ['Girls Skirt Blue', '32', 525],
      ['Girls Half Shirt Blue', '32', 450], ['Boys & Girls Full Pant Blue', '32', 520],
      ['Boys & Girls Full Shirt Blue', '32', 480], ['Pullovers Boys & Girls', '32', 575],
      ['Sports Track Pant', '32', 320], ['Sports T-Shirt', '32', 400], ['Belt', '32', 120],
      // SIZE 34
      ['Boys Half Pant Blue', '34', 525], ['Boys Half Shirt Blue', '34', 500], ['Girls Skirt Blue', '34', 550],
      ['Girls Half Shirt Blue', '34', 500], ['Boys & Girls Full Pant Blue', '34', 540],
      ['Boys & Girls Full Shirt Blue', '34', 520], ['Pullovers Boys & Girls', '34', 575],
      ['Sports Track Pant', '34', 330], ['Sports T-Shirt', '34', 410], ['Belt', '34', 120],
      // SIZE 36
      ['Boys Half Pant Blue', '36', 525], ['Boys Half Shirt Blue', '36', 525], ['Girls Skirt Blue', '36', 550],
      ['Girls Half Shirt Blue', '36', 525], ['Boys & Girls Full Pant Blue', '36', 550],
      ['Boys & Girls Full Shirt Blue', '36', 540], ['Pullovers Boys & Girls', '36', 600],
      ['Sports Track Pant', '36', 340], ['Sports T-Shirt', '36', 430], ['Belt', '36', 120],
      // SIZE 38
      ['Boys Half Pant Blue', '38', 550], ['Boys Half Shirt Blue', '38', 525], ['Girls Skirt Blue', '38', 600],
      ['Girls Half Shirt Blue', '38', 525], ['Boys & Girls Full Pant Blue', '38', 560],
      ['Boys & Girls Full Shirt Blue', '38', 550], ['Pullovers Boys & Girls', '38', 650],
      ['Sports Track Pant', '38', 350], ['Sports T-Shirt', '38', 440], ['Belt', '38', 120],
      // SIZE 40
      ['Boys Half Pant Blue', '40', 550], ['Boys Half Shirt Blue', '40', 525], ['Girls Skirt Blue', '40', 600],
      ['Girls Half Shirt Blue', '40', 525], ['Boys & Girls Full Pant Blue', '40', 560],
      ['Boys & Girls Full Shirt Blue', '40', 550], ['Pullovers Boys & Girls', '40', 650],
      ['Sports Track Pant', '40', 360], ['Sports T-Shirt', '40', 450], ['Belt', '40', 120],
      // SIZE 42
      ['Boys Half Pant Blue', '42', 550], ['Boys Half Shirt Blue', '42', 525], ['Girls Skirt Blue', '42', 625],
      ['Girls Half Shirt Blue', '42', 525], ['Boys & Girls Full Pant Blue', '42', 570],
      ['Boys & Girls Full Shirt Blue', '42', 560], ['Pullovers Boys & Girls', '42', 650], ['Belt', '42', 120],
      // SIZE 44
      ['Boys Half Pant Blue', '44', 600], ['Boys Half Shirt Blue', '44', 525], ['Girls Skirt Blue', '44', 650],
      ['Girls Half Shirt Blue', '44', 525], ['Boys & Girls Full Pant Blue', '44', 630],
      ['Boys & Girls Full Shirt Blue', '44', 570], ['Pullovers Boys & Girls', '44', 650], ['Belt', '44', 120],
      // SIZE S
      ['Bag', 'S', 350], ['Blazer', 'S', 1550],
      // SIZE L
      ['Bag', 'L', 450],
      // SIZE XL
      ['Bag', 'XL', 500],
    ]
    for (const [compName, sizeName, price] of bluePrices) {
      await client.query(
        `INSERT INTO si_vp_prices (school_id, product_id, component_id, variant_id, price)
         VALUES ($1::int, $2::int, $3::int, $4::int, $5::numeric)`,
        [DEFAULT_SCHOOL_ID, blueProductId, blueCompIdMap[compName], blueVarIdMap[sizeName], price]
      )
    }

    // ================================================================
    // BROWN UNIFORM
    // ================================================================
    const brownRes = await client.query(`
      INSERT INTO si_vp_products (school_id, name, code, academic_year, status)
      VALUES ($1::int, 'School Uniform - Brown', 'SU-BROWN', '2026-27', 'Active')
      RETURNING id`, [DEFAULT_SCHOOL_ID])
    const brownProductId = brownRes.rows[0].id

    await client.query(`
      INSERT INTO si_vp_groups (school_id, product_id, name, display_order) VALUES
        ($1, $2, 'UNIFORM', 1), ($1, $2, 'SPORTS', 2), ($1, $2, 'ACCESSORIES', 3)`,
      [DEFAULT_SCHOOL_ID, brownProductId])
    const brownGroupsRes = await client.query(`SELECT id, name FROM si_vp_groups WHERE product_id = $1`, [brownProductId])
    const brownGid = Object.fromEntries(brownGroupsRes.rows.map((r) => [r.name, r.id]))

    const brownComponents = [
      // UNIFORM group
      { name: 'Boys Half Pant Brown', shortName: 'Boys Half Pant', group: 'UNIFORM', sizeDependent: true },
      { name: 'Boys Half Shirt Brown', shortName: 'Boys Half Shirt', group: 'UNIFORM', sizeDependent: true },
      { name: 'Girls Skirt Brown', shortName: 'Girls Skirt', group: 'UNIFORM', sizeDependent: true },
      { name: 'Girls Half Shirt Brown', shortName: 'Girls Half Shirt', group: 'UNIFORM', sizeDependent: true },
      { name: 'Boys & Girls Full Pant Brown', shortName: 'Full Pant', group: 'UNIFORM', sizeDependent: true },
      { name: 'Boys & Girls Full Shirt Brown', shortName: 'Full Shirt', group: 'UNIFORM', sizeDependent: true },
      { name: 'Pullovers Boys & Girls', shortName: 'Pullover', group: 'UNIFORM', sizeDependent: true },
      { name: 'Cap Boys & Girls', shortName: 'Cap', group: 'UNIFORM', sizeDependent: true },
      { name: 'Blazer', shortName: 'Blazer', group: 'UNIFORM', sizeDependent: true },
      // SPORTS group
      { name: 'Sports Track Pant', shortName: 'Track Pant', group: 'SPORTS', sizeDependent: true },
      { name: 'Sports T-Shirt', shortName: 'T-Shirt', group: 'SPORTS', sizeDependent: true },
      // ACCESSORIES group
      { name: 'Bag', shortName: 'Bag', group: 'ACCESSORIES', sizeDependent: false },
      { name: 'Belt', shortName: 'Belt', group: 'ACCESSORIES', sizeDependent: false },
      { name: 'I Card Student', shortName: 'ID Card Student', group: 'ACCESSORIES', sizeDependent: false },
      { name: 'I Card Teacher & Sister', shortName: 'ID Card Teacher & Sister', group: 'ACCESSORIES', sizeDependent: false },
      { name: 'Diary', shortName: 'Diary', group: 'ACCESSORIES', sizeDependent: false },
      { name: 'Tie', shortName: 'Tie', group: 'ACCESSORIES', sizeDependent: false },
    ]
    let ord = 1
    const brownCompIdMap = {}
    for (const comp of brownComponents) {
      const gid = brownGid[comp.group]
      const r = await client.query(
        `INSERT INTO si_vp_components (school_id, product_id, group_id, name, short_name, size_dependent, display_order, is_active)
         VALUES ($1::int, $2::int, $3, $4, $5, $6::boolean, $7::int, true) RETURNING id`,
        [DEFAULT_SCHOOL_ID, brownProductId, gid, comp.name, comp.shortName || comp.name, comp.sizeDependent, ord++]
      )
      brownCompIdMap[comp.name] = r.rows[0].id
    }

    const brownVarIdMap = {}
    for (const v of variants) {
      const r = await client.query(
        `INSERT INTO si_vp_variants (school_id, product_id, name, is_active, display_order)
         VALUES ($1::int, $2::int, $3, true, $4::int) RETURNING id`,
        [DEFAULT_SCHOOL_ID, brownProductId, v.name, variants.indexOf(v) + 1]
      )
      brownVarIdMap[v.name] = r.rows[0].id
    }

    const brownPrices = [
      // SIZE 20
      ['Boys Half Pant Brown', '20', 380], ['Boys Half Shirt Brown', '20', 380], ['Girls Skirt Brown', '20', 455],
      ['Girls Half Shirt Brown', '20', 380], ['Boys & Girls Full Pant Brown', '20', 460],
      ['Boys & Girls Full Shirt Brown', '20', 430], ['Pullovers Boys & Girls', '20', 550],
      ['Cap Boys & Girls', '20', 150], ['Belt', '20', 100], ['I Card Student', '20', 200],
      ['I Card Teacher & Sister', '20', 250], ['Diary', '20', 200], ['Tie', '20', 100],
      // SIZE 22
      ['Boys Half Pant Brown', '22', 455], ['Boys Half Shirt Brown', '22', 405], ['Girls Skirt Brown', '22', 480],
      ['Girls Half Shirt Brown', '22', 405], ['Boys & Girls Full Pant Brown', '22', 470],
      ['Boys & Girls Full Shirt Brown', '22', 430], ['Pullovers Boys & Girls', '22', 550], ['Belt', '22', 100],
      // SIZE 24
      ['Boys Half Pant Brown', '24', 480], ['Boys Half Shirt Brown', '24', 430], ['Girls Skirt Brown', '24', 505],
      ['Girls Half Shirt Brown', '24', 430], ['Boys & Girls Full Pant Brown', '24', 510],
      ['Boys & Girls Full Shirt Brown', '24', 460], ['Pullovers Boys & Girls', '24', 550],
      ['Sports Track Pant', '24', 270], ['Sports T-Shirt', '24', 360], ['Belt', '24', 100],
      // SIZE 26
      ['Boys Half Pant Brown', '26', 505], ['Boys Half Shirt Brown', '26', 455], ['Girls Skirt Brown', '26', 530],
      ['Girls Half Shirt Brown', '26', 430], ['Boys & Girls Full Pant Brown', '26', 520],
      ['Boys & Girls Full Shirt Brown', '26', 465], ['Pullovers Boys & Girls', '26', 550],
      ['Sports Track Pant', '26', 280], ['Sports T-Shirt', '26', 370], ['Belt', '26', 110],
      // SIZE 28
      ['Boys Half Pant Brown', '28', 505], ['Boys Half Shirt Brown', '28', 480], ['Girls Skirt Brown', '28', 530],
      ['Girls Half Shirt Brown', '28', 455], ['Boys & Girls Full Pant Brown', '28', 530],
      ['Boys & Girls Full Shirt Brown', '28', 500], ['Pullovers Boys & Girls', '28', 550],
      ['Sports Track Pant', '28', 290], ['Sports T-Shirt', '28', 380], ['Belt', '28', 110],
      // SIZE 30
      ['Boys Half Pant Brown', '30', 530], ['Boys Half Shirt Brown', '30', 480], ['Girls Skirt Brown', '30', 530],
      ['Girls Half Shirt Brown', '30', 480], ['Boys & Girls Full Pant Brown', '30', 550],
      ['Boys & Girls Full Shirt Brown', '30', 500], ['Pullovers Boys & Girls', '30', 575],
      ['Sports Track Pant', '30', 310], ['Sports T-Shirt', '30', 390], ['Belt', '30', 110],
      // SIZE 32
      ['Boys Half Pant Brown', '32', 530], ['Boys Half Shirt Brown', '32', 490], ['Girls Skirt Brown', '32', 555],
      ['Girls Half Shirt Brown', '32', 480], ['Boys & Girls Full Pant Brown', '32', 550],
      ['Boys & Girls Full Shirt Brown', '32', 510], ['Pullovers Boys & Girls', '32', 575],
      ['Sports Track Pant', '32', 320], ['Sports T-Shirt', '32', 400], ['Belt', '32', 120],
      // SIZE 34
      ['Boys Half Pant Brown', '34', 555], ['Boys Half Shirt Brown', '34', 530], ['Girls Skirt Brown', '34', 580],
      ['Girls Half Shirt Brown', '34', 530], ['Boys & Girls Full Pant Brown', '34', 570],
      ['Boys & Girls Full Shirt Brown', '34', 550], ['Pullovers Boys & Girls', '34', 575],
      ['Sports Track Pant', '34', 330], ['Sports T-Shirt', '34', 410], ['Belt', '34', 120],
      // SIZE 36
      ['Boys Half Pant Brown', '36', 555], ['Boys Half Shirt Brown', '36', 555], ['Girls Skirt Brown', '36', 580],
      ['Girls Half Shirt Brown', '36', 555], ['Boys & Girls Full Pant Brown', '36', 580],
      ['Boys & Girls Full Shirt Brown', '36', 570], ['Pullovers Boys & Girls', '36', 600],
      ['Sports Track Pant', '36', 340], ['Sports T-Shirt', '36', 430], ['Belt', '36', 120],
      // SIZE 38
      ['Boys Half Pant Brown', '38', 580], ['Boys Half Shirt Brown', '38', 555], ['Girls Skirt Brown', '38', 630],
      ['Girls Half Shirt Brown', '38', 555], ['Boys & Girls Full Pant Brown', '38', 590],
      ['Boys & Girls Full Shirt Brown', '38', 580], ['Pullovers Boys & Girls', '38', 650],
      ['Sports Track Pant', '38', 350], ['Sports T-Shirt', '38', 440], ['Belt', '38', 120],
      // SIZE 40
      ['Boys Half Pant Brown', '40', 580], ['Boys Half Shirt Brown', '40', 555], ['Girls Skirt Brown', '40', 630],
      ['Girls Half Shirt Brown', '40', 555], ['Boys & Girls Full Pant Brown', '40', 590],
      ['Boys & Girls Full Shirt Brown', '40', 580], ['Pullovers Boys & Girls', '40', 650],
      ['Sports Track Pant', '40', 360], ['Sports T-Shirt', '40', 450], ['Belt', '40', 120],
      // SIZE 42
      ['Boys Half Pant Brown', '42', 580], ['Boys Half Shirt Brown', '42', 555], ['Girls Skirt Brown', '42', 655],
      ['Girls Half Shirt Brown', '42', 555], ['Boys & Girls Full Pant Brown', '42', 600],
      ['Boys & Girls Full Shirt Brown', '42', 590], ['Pullovers Boys & Girls', '42', 650], ['Belt', '42', 120],
      // SIZE 44
      ['Boys Half Pant Brown', '44', 630], ['Boys Half Shirt Brown', '44', 555], ['Girls Skirt Brown', '44', 680],
      ['Girls Half Shirt Brown', '44', 555], ['Boys & Girls Full Pant Brown', '44', 660],
      ['Boys & Girls Full Shirt Brown', '44', 600], ['Pullovers Boys & Girls', '44', 650], ['Belt', '44', 120],
      // SIZE S
      ['Bag', 'S', 350], ['Blazer', 'S', 1550],
      // SIZE L
      ['Bag', 'L', 450],
      // SIZE XL
      ['Bag', 'XL', 500],
    ]
    for (const [compName, sizeName, price] of brownPrices) {
      await client.query(
        `INSERT INTO si_vp_prices (school_id, product_id, component_id, variant_id, price)
         VALUES ($1::int, $2::int, $3::int, $4::int, $5::numeric)`,
        [DEFAULT_SCHOOL_ID, brownProductId, brownCompIdMap[compName], brownVarIdMap[sizeName], price]
      )
    }

    await client.query("COMMIT")

    // ---- Report ----
    const [bp, bn] = await Promise.all([
      client.query(`SELECT COUNT(*)::int pc FROM si_vp_prices WHERE product_id = $1::int`, [blueProductId]),
      client.query(`SELECT COUNT(*)::int pc FROM si_vp_prices WHERE product_id = $1::int`, [brownProductId]),
    ])
    console.log('Blue product id:', blueProductId, 'prices:', bp.rows[0].pc)
    console.log('Brown product id:', brownProductId, 'prices:', bn.rows[0].pc)
    console.log('Seed complete.')
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {})
    console.error('ERROR:', e.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
