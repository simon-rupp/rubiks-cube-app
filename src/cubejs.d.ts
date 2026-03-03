declare module 'cubejs' {
  export default class Cube {
    constructor(state?: Cube | unknown)
    static random(): Cube
    move(algorithm: string): Cube
    randomize(): Cube
    identity(): Cube
    asString(): string
    isSolved(): boolean
  }
}
