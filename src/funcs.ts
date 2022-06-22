export function nError(error: unknown)
{
  alert('Возникла ошибка: ' + (error instanceof Error ? error.message : JSON.stringify(error)))
  console.error(error)
}

export const asyncSleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))
