export default async function fetcher (...args) {
  try {
    const response = await global.fetch(...args)
    // if the server replies, there's always some data in json
    // if there's a network error, it will throw at the previous line
    const json = await response.json()
    if (response.ok) {
      return json
    }

    const error = new Error(response.statusText)
    error.response = response
    error.data = data
    throw error
  } catch (error) {
    if (!error.data) {
      error.data = { message: error.message }
    }
    // throw error
    return { err: true }
  }
}
