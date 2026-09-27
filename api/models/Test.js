import { pool } from './db.js'

const getAllTests = async () => {
  const result = await pool.query('SELECT * FROM test')
  return result
}

<<<<<<< HEAD
export { getAllTests }
=======
export { getAllTests }
>>>>>>> origin/yhdistetty-versio
