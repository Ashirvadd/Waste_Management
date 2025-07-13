import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Call the backend to start Streamlit
    const response = await fetch('http://localhost:5000/api/start-streamlit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Streamlit started successfully' });
    } else {
      return NextResponse.json({ success: false, message: data.error || 'Failed to start Streamlit' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error starting Streamlit:', error);
    return NextResponse.json({ success: false, message: 'Failed to start Streamlit' }, { status: 500 });
  }
} 