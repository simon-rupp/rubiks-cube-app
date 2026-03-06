import { useCallback, useState } from 'react'
import Cube from 'cubejs'
import type { MoveHandler } from '../types/cube'

type UseCubeStateResult = {
  facelets: string
  lastAction: string
  runMove: MoveHandler
  scramble: () => void
  reset: () => void
}

export function useCubeState(): UseCubeStateResult {
  const [cube] = useState(() => new Cube())
  const [facelets, setFacelets] = useState(() => cube.asString())
  const [lastAction, setLastAction] = useState('Ready')

  const refresh = useCallback(
    (label: string) => {
      setFacelets(cube.asString())
      setLastAction(label)
    },
    [cube],
  )

  const runMove = useCallback<MoveHandler>(
    (move: string, label: string) => {
      cube.move(move)
      refresh(`${label} (${move})`)
    },
    [cube, refresh],
  )

  const scramble = useCallback(() => {
    cube.randomize()
    refresh('Scrambled')
  }, [cube, refresh])

  const reset = useCallback(() => {
    cube.identity()
    refresh('Reset to solved state')
  }, [cube, refresh])

  return {
    facelets,
    lastAction,
    runMove,
    scramble,
    reset,
  }
}
