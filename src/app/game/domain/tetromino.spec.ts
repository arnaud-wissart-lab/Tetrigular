import { getTetrominoMatrix, rotateClockwise } from './tetromino';
import { RotationState, TetrominoType } from './types';

describe('tetromino domain', () => {
  it('expose 4 etats de rotation coherents', () => {
    const spawn = getTetrominoMatrix(TetrominoType.T, RotationState.Spawn);
    const right = getTetrominoMatrix(TetrominoType.T, RotationState.Right);
    const reverse = getTetrominoMatrix(TetrominoType.T, RotationState.Reverse);
    const left = getTetrominoMatrix(TetrominoType.T, RotationState.Left);

    expect(spawn).not.toEqual(right);
    expect(right).not.toEqual(reverse);
    expect(reverse).not.toEqual(left);
  });

  it('fait un cycle complet en 4 rotations', () => {
    let state = RotationState.Spawn;
    state = rotateClockwise(state);
    state = rotateClockwise(state);
    state = rotateClockwise(state);
    state = rotateClockwise(state);

    expect(state).toBe(RotationState.Spawn);
  });
});
