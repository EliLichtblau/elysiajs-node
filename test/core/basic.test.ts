import Elysia from 'elysia'
import { inject } from 'light-my-request'
import { describe, it, expect } from 'vitest'

import node from '../../src'

const app = new Elysia({ adapter: node() })
	.get('/', () => 'hi')
	.get('/static', 'hi')
	.post('/json', ({ body }) => body)
	.compile()

// @ts-expect-error
const handle = app._handle!

describe('Node - Core', () => {
	it('handle request', () => {
		inject(handle, { path: '/' }, (error, res) => {
			expect(error).toBeNull()

			expect(res?.body).toBe('hi')
			expect(res?.headers['content-type']).toBe('text/plain;charset=utf8')
		})
	})

	it('handle static response', () => {
		inject(handle, { path: '/static' }, (error, res) => {
			expect(error).toBeNull()

			expect(res?.body).toBe('hi')
			expect(res?.headers['content-type']).toBe('text/plain;charset=utf8')
		})
	})

	it('handle body', () => {
		inject(
			handle,
			{
				path: '/json',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ a: 1 })
			},
			(error, res) => {
				expect(error).toBeNull()

				expect(res?.body).toBe(JSON.stringify({ a: 1 }))
				expect(res?.headers['content-type']).toBe(
					'application/json;charset=utf8'
				)
			}
		)
	})

	it('handle plugin', () => {
		const plugin = new Elysia({ prefix: '/api/v1' }).post(
			'/',
			async ({ request }) => {
				return {
					message: 'Yugiri'
				}
			},
			{
				beforeHandle({ request }) {
					request
				}
			}
		)

		const app = new Elysia({
			adapter: node()
		})
			.use(plugin)
			.compile()

		inject(
			// @ts-ignore
			app._handle,
			{
				path: '/api/v1',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ message: 'Hello Yugiri' })
			},
			(error, res) => {
				expect(error).toBeNull()

				expect(res?.body).toBe(JSON.stringify({ message: 'Yugiri' }))
				expect(res?.headers['content-type']).toBe(
					'application/json;charset=utf8'
				)
			}
		)
	})

	it('handle cookie', () => {
		const app = new Elysia({ adapter: node() })
			.use((app) =>
				app
					.derive({ as: 'global' }, async ({ cookie }) => {})
					.onAfterHandle({ as: 'global' }, async ({ response }) => {
						return response
					})
			)
			.get('/', () => 'ok')
			.compile()

		inject(
			// @ts-ignore
			app._handle,
			{
				path: '/',
				method: 'GET'
			},
			(error, res) => {
				expect(error).toBeNull()

				expect(res?.body).toBe('ok')
				expect(res?.headers['content-type']).toBe(
					'text/plain;charset=utf8'
				)
			}
		)
	})
})
