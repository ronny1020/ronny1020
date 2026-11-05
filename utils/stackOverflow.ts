import {
  REQUEST_TIMEOUT_MS,
  STACK_EXCHANGE_API_URL,
  STACK_OVERFLOW_USER_ID,
} from './config.ts'
import type { StackOverflowStats } from './types.ts'

type Answer = { is_accepted?: boolean }
type AnswersPage = { has_more?: boolean; items?: Answer[] }

/** Bounds the keyless quota, 300 requests a day per IP shared on a CI runner. */
const MAX_PAGES = 5

/**
 * My answer count, how many were accepted, and my reputation; null when the
 * Stack Exchange API is unreachable, throttled, or has more answers than
 * `MAX_PAGES` holds, so a published count is always complete.
 */
export async function fetchStackOverflowStats(): Promise<StackOverflowStats | null> {
  const [answers, reputation] = await Promise.all([
    fetchAnswers(),
    fetchReputation(),
  ])

  if (!answers || reputation === null) {
    return null
  }

  return {
    accepted: answers.filter((answer) => answer.is_accepted).length,
    answers: answers.length,
    reputation,
  }
}

async function fetchAnswers(): Promise<Answer[] | null> {
  const answers: Answer[] = []

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const body = await stackExchangeJson<AnswersPage>(
      `/users/${STACK_OVERFLOW_USER_ID}/answers?site=stackoverflow&pagesize=100&page=${page}`,
    )

    if (!body) {
      return null
    }

    answers.push(...(body.items ?? []))

    if (!body.has_more) {
      return answers
    }
  }

  return null
}

async function fetchReputation(): Promise<number | null> {
  const body = await stackExchangeJson<{ items?: { reputation?: number }[] }>(
    `/users/${STACK_OVERFLOW_USER_ID}?site=stackoverflow`,
  )

  return body?.items?.[0]?.reputation ?? null
}

/** A Stack Exchange API response body, or null on any failure. */
async function stackExchangeJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${STACK_EXCHANGE_API_URL}${path}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    return response.ok ? ((await response.json()) as T) : null
  } catch {
    return null
  }
}
