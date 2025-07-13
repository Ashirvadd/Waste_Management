import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    
    const houseId = formData.get('houseId') as string;
    const recordedLang = formData.get('recordedLang') as string;
    const nativeText = formData.get('nativeText') as string;
    const translatedText = formData.get('translatedText') as string;
    const remarks = formData.get('remarks') as string;
    const userRole = formData.get('userRole') as string;
    const userName = formData.get('userName') as string;
    const audioFile = formData.get('audio') as File | null;

    // Validation
    if (!nativeText && !audioFile) {
      return NextResponse.json(
        { error: 'Either text or audio file is required' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Create new form data for backend
    const backendFormData = new FormData();
    backendFormData.append('houseId', houseId || '');
    backendFormData.append('recordedLang', recordedLang || 'en');
    backendFormData.append('nativeText', nativeText || '');
    backendFormData.append('translatedText', translatedText || '');
    backendFormData.append('remarks', remarks || '');
    backendFormData.append('userRole', userRole || '');
    backendFormData.append('userName', userName || '');
    
    if (audioFile) {
      backendFormData.append('audio', audioFile);
    }

    const response = await fetch(`${backendUrl}/api/voice-logs`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: backendFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to save voice log' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Voice log saved successfully',
      voiceLog: data.voiceLog
    });

  } catch (error) {
    console.error('Voice log save error:', error);
    return NextResponse.json(
      { error: 'Failed to save voice log. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/voice-logs`, {
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch voice logs' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      logs: data.logs || []
    });

  } catch (error) {
    console.error('Voice log fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice logs. Please try again.' },
      { status: 500 }
    );
  }
} 