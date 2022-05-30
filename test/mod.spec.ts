import { add } from '../src/x-popup'

describe('add(a, b)', () => {
  it('adds two numbers together', () => {
    expect(add(1, 2)).toEqual(3)
  })
})
