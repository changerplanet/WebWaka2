import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Endpoint moved', 
      message: 'This endpoint has been moved to /api/education/students',
      status: 301
    },
    { status: 301, headers: { 'Location': '/api/education/students' } }
  )
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Endpoint moved', 
      message: 'This endpoint has been moved to /api/education/students',
      status: 301
    },
    { status: 301, headers: { 'Location': '/api/education/students' } }
  )
}
