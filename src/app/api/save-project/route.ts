import { NextResponse } from 'next/server';
import https from 'https';

export async function POST(request: Request) {
  try {
    console.log('Handling save-project request');

    // Get request body
    const body = await request.json();
    console.log('Request body:', body);

    // Use the current ngrok URL with the correct /api prefix
    const BACKEND_URL = 'https://00fd-136-232-6-66.ngrok-free.app';
    const apiUrl = `${BACKEND_URL}/api/save-project`; // Add /api here
    console.log(`Forwarding request to ${apiUrl}`);
    
    // Create an agent that ignores SSL certificate issues
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });

    // Make the request with detailed error handling
    const backendResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      agent: httpsAgent
    });

    console.log('Backend response status:', backendResponse.status);
    
    const responseText = await backendResponse.text();
    console.log('Response text:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing response as JSON:', error);
      return NextResponse.json(
        { error: 'Invalid JSON response from backend', details: responseText },
        { status: 500 }
      );
    }
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to backend server',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}