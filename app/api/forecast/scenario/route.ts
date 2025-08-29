import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const requestBody = await req.json();

  // Construct the URL for the FastAPI backend
  const fastapiUrl = `http://localhost:8004/forecast/scenario`;

  try {
    const response = await fetch(fastapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // If FastAPI returns an error, propagate it
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying scenario request to FastAPI:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
