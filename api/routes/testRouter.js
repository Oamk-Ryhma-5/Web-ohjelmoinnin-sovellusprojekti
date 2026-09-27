import { Router } from 'express'
import { getTests } from '../controllers/TestController.js'

const router = Router()

router.get('/', getTests)

<<<<<<< HEAD
export default router
=======
export default router
>>>>>>> origin/yhdistetty-versio
