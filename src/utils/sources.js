export const sources = [
  ['1zU7BdQQ2qvCR80ku3WT6YQhu8s9aTCSf3UHLWlhKahc', 'thailand', true],
  ['1RSHC9A4T8OvT0XLFCdMbds9Z5ky2GsbLhtDqFhb4Pkw', '', true],
  ['10S-flnjUlbZzQVBXmHKe7y7tXVfYc3Gg2O6KmSGDjMQ', 'thailand', true],
  ['1H88jEc_anrOW63YsZsxdxb2sdH0mMV0Eemq0iW1Tr-Q', '', true],
  ['1UvY0Fd5lmgRhPlSdIKn1Clfywo3yU7qcrLTwrRWosuU', 'thailand', false],
  ['1HCaeRIunaianxgeyKQceselxyk1IxHzb5k9KBlfMsDA', 'china', false],
  ['1Irbm_DlW63XjhS54qbopw18WnpJpo_s3gbrDKqkmyvY', 'oversea', false],
  ['1umKIOnnCtnNHRQKQs-O3J9cHvamUZqtu8bY__SvgR3g', 'thailand', false],
  ['1gEwDgp7F_ACqWCu7qShCJkhRtMPZusO0USgMdaBTFmo', '', false],
]
export function sourceRule(id) {
  return sources.find(([key]) =>
    String(id || '')
      .split(':')
      .includes(key),
  )
}
