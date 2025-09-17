import { NextRequest, NextResponse } from 'next/server'

const FORECASTING_SERVICE_URL = process.env.FORECASTING_SERVICE_URL || 'http://localhost:8004'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id parameter is required' },
        { status: 400 }
      )
    }

    // Proxy the request to the forecasting service
    const response = await fetch(`${FORECASTING_SERVICE_URL}/variance-reports/${params.reportId}?tenant_id=${tenantId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Forecasting service returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating variance report:', error)
    return NextResponse.json(
      { error: 'Failed to update variance report' },
      { status: 500 }
    )
  }
}