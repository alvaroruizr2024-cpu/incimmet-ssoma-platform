'use client';
import { useSyncExternalStore } from 'react';
const reducedQuery = '(prefers-reduced-motion: reduce)';
function subscribeReduced(cb: () => void) {
  const media = window.matchMedia(reducedQuery);
  media.addEventListener('change', cb);
  return () => media.removeEventListener('change', cb);
}
function snapshotReduced() {
  return window.matchMedia(reducedQuery).matches;
}
function reducedOnServer() {
  return true;
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, snapshotReduced, reducedOnServer);
}
function subscribeVisibility(cb: () => void) {
  document.addEventListener('visibilitychange', cb);
  return () => document.removeEventListener('visibilitychange', cb);
}
function snapshotVisible() {
  return document.visibilityState === 'visible';
}
function hiddenOnServer() {
  return false;
}
export function usePageVisible() {
  return useSyncExternalStore(subscribeVisibility, snapshotVisible, hiddenOnServer);
}
