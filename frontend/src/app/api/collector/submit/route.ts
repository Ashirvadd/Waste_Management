import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      completedHouses, 
      completedWards,
      wasteTypes, 
      image, 
      segregationViolation, 
      timestamp, 
      location, 
      remarks 
    } = body;

    // Validation
    if (!completedHouses || completedHouses.length === 0 || !wasteTypes || wasteTypes.length === 0 || !timestamp) {
      return NextResponse.json(
        { error: 'Completed houses, waste types, and timestamp are required' },
        { status: 400 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Prepare form data for image upload
    const formData = new FormData();
    
    // Add the image file if provided
    if (image && image.data) {
      // Convert base64 to blob
      const base64Data = image.data.split(',')[1]; // Remove data URL prefix
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: image.type || 'image/jpeg' });
      
      formData.append('image', blob, image.name || 'waste-image.jpg');
    }

    // Add other data as JSON string
    const collectionData = {
      completedHouses,
      completedWards,
      wasteTypes,
      segregationViolation,
      timestamp,
      location,
      remarks: remarks || ''
    };

    formData.append('data', JSON.stringify(collectionData));

    // Forward request to backend collector endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/collector/submit`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Submission failed' },
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json({
      message: 'Collection data submitted successfully',
      collectionEntries: data.collectionEntries,
      reports: data.reports,
      totalReports: data.totalReports,
      completedHouses: data.completedHouses,
      completedWards: data.completedWards
    });

  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Submission failed. Please try again.' },
      { status: 500 }
    );
  }
} 