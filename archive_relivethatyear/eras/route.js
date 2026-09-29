import { NextResponse } from 'next/server';
import { getAllEras, getEraById } from '@/lib/dataService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const era = await getEraById(id);
      return NextResponse.json({ success: true, era });
    }

    const eras = await getAllEras();
    return NextResponse.json({ success: true, eras });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
