'use client';
import { createContext, useContext } from 'react';
export const IntroMotionContext = createContext(false);
export function useIntroMotion() {
  return useContext(IntroMotionContext);
}
