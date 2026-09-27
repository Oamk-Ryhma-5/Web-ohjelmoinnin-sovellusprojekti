import { getAllTests } from '../models/Test.js'

const getTests = async (req, res, next) => {
  try {
    const result = await getAllTests()
    res.status(200).json(result.rows || [])
  } catch (error) {
<<<<<<< HEAD
    next(error) 
  }
}

export {
  getTests
}
=======
    next(error)
  }
}

export { getTests }
>>>>>>> origin/yhdistetty-versio
