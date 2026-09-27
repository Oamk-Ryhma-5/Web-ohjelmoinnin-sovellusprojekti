// Sama virheluokka kuin Todo-tehtävässä. code valitsee käyttöliittymän käännöksen.
export class ApiError extends Error {
  constructor(message, status = 400, code = 'INVALID_REQUEST') {
    super(message)
    this.status = status
    this.code = code
  }
}
