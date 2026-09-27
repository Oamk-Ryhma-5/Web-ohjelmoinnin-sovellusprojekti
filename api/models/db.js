<<<<<<< HEAD
=======
import 'dotenv/config'
>>>>>>> origin/yhdistetty-versio
import pkg from 'pg'

const { Pool } = pkg

const openDb = () => {
  const pool = new Pool({
    user: process.env.DB_USER,
<<<<<<< HEAD
    host: process.env.DB_HOST,    
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
=======
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
>>>>>>> origin/yhdistetty-versio
  })
  return pool
}

<<<<<<< HEAD
const pool = openDb() 

export { pool }
=======
const pool = openDb()

export { pool }
>>>>>>> origin/yhdistetty-versio
