import { NextRequest } from 'next/server';

export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return !origin || origin === request.nextUrl.origin;
}