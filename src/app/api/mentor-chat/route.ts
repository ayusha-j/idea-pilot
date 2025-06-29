import { NextResponse } from 'next/server';

// The backend URL from environment variable
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://413a-136-232-6-66.ngrok-free.app';

export async function POST(request: Request) {
  try {
    // Get request body
    const body = await request.json();
    console.log('Mentor chat API: Received request body:', {
      hasMessage: !!body.message,
      hasProjectContext: !!body.projectContext,
      projectTitle: body.projectContext?.title,
      projectDescription: body.projectContext?.description,
      messageHistoryLength: body.messageHistory?.length || 0
    });
    
    // Check if backend URL is configured
    if (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('your-current-ngrok-url')) {
      console.error('Mentor chat API: Backend URL not properly configured');
      return NextResponse.json(
        { 
          error: 'Backend server not configured. Please update NEXT_PUBLIC_API_URL in .env.local with your current ngrok URL.',
          details: 'The backend API URL appears to be a placeholder or not set. Make sure your Flask server is running and ngrok is active.'
        },
        { status: 503 }
      );
    }
    
    // Use environment variable for backend URL
    const apiUrl = `${BACKEND_URL}/api/mentor-chat`;
    
    console.log(`Mentor chat API: Forwarding request to: ${apiUrl}`);
    
    // Forward the request to your Flask backend
    const backendResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Mentor chat API: Backend response status:', backendResponse.status);
    console.log('Mentor chat API: Backend response headers:', Object.fromEntries(backendResponse.headers.entries()));
    
    // Get the response as text first
    const responseText = await backendResponse.text();
    console.log('Mentor chat API: Response text preview:', responseText.substring(0, 200));
    
    // Check if response looks like HTML (common when ngrok URL is wrong)
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.error('Mentor chat API: Received HTML instead of JSON - backend URL likely incorrect');
      return NextResponse.json(
        { 
          error: 'Backend server returned HTML instead of JSON. This usually means the ngrok URL has expired or changed.',
          details: 'Please check that your Flask server is running and update NEXT_PUBLIC_API_URL in .env.local with the current ngrok URL.',
          backend_url: apiUrl,
          response_preview: responseText.substring(0, 200)
        },
        { status: 502 }
      );
    }
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Mentor chat API: Successfully parsed response, has chatResponse:', !!responseData.chatResponse);
    } catch (error) {
      console.error('Mentor chat API: Error parsing response as JSON:', error);
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from backend',
          details: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''),
          backend_status: backendResponse.status,
          backend_url: apiUrl
        },
        { status: 502 }
      );
    }
    
    // Check if backend returned an error status
    if (!backendResponse.ok) {
      console.error('Mentor chat API: Backend returned error status:', backendResponse.status);
      console.error('Mentor chat API: Backend error data:', responseData);
      
      // Forward the backend error to the frontend
      return NextResponse.json(
        responseData,
        { status: backendResponse.status }
      );
    }
    
    // Return the mentor chat response to the frontend
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error: any) {
    console.error('Mentor chat API: Error processing request:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to get AI mentor response',
        details: errorMessage,
        stack: errorDetails,
        backend_url: BACKEND_URL
      },
      { status: 500 }
    );
  }
}