import { NextResponse } from 'next/server';
import { getShowRequests, submitShowRequest, voteForShowRequest } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const requests = await getShowRequests();
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, id, title, genre, platform, requestedBy } = body;

    if (action === 'vote') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'Request ID is required for vote' }, { status: 400 });
      }
      const updated = await voteForShowRequest(id);
      return NextResponse.json({ success: true, request: updated });
    }

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const created = await submitShowRequest(title, genre, platform, requestedBy);
    return NextResponse.json({ success: true, request: created });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
