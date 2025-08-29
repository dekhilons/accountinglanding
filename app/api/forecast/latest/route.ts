import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenant_id = searchParams.get('tenant_id');
  const period = searchParams.get('period');
  const metric_type = searchParams.get('metric_type');

  // Construct the URL for the FastAPI backend
  const fastapiUrl = `http://localhost:8004/forecast/latest?tenant_id=${tenant_id}&period=${period}&metric_type=${metric_type}`;

  try {
    const response = await fetch(fastapiUrl);
    if (!response.ok) {
      // If FastAPI returns an error, propagate it
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying request to FastAPI:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
