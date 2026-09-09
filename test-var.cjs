const { Pool } = require('pg')
const p = new Pool({ connectionString: 'postgresql://postgres:123@localhost/appstrice_school' })
;(async () => {
  try {
    const c = await p.connect()
    const r = await c.query(
      `INSERT INTO si_vp_variants (school_id, product_id, name, is_active, display_order)
       VALUES ($1::int, $2::int, $3, true, $4::int) RETURNING id`,
      [1, 15, '20', 1]
    )
    console.log('OK', r.rows[0])
    await c.query('ROLLBACK')
    c.release()
    await p.end()
  } catch (e) {
    console.error('ERR', e.message)
    await p.end()
  }
})()
