// app/api/regenerate-project/route.ts
import { NextResponse } from 'next/server';
import https from 'https';

// The actual backend URL with IP address
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://413a-136-232-6-66.ngrok-free.app';

// Create a custom HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function POST(request: Request) {
  try {
    console.log('Handling regenerate-project request');
    
    // Get the request body
    let body = {};
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (e) {
      console.log('Error parsing request body:', e);
      // If there's no body or it's not valid JSON, use an empty object
      console.log('No body or invalid JSON, using empty object');
    }
    
    // Use the correct path to the API endpoint - include /api/ prefix
    const apiUrl = `${BACKEND_URL}/api/regenerate-project`;
    console.log(`Forwarding request to ${apiUrl}`);
    
    // Forward the request to your Flask backend with certificate validation disabled
    const backendResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // Use the agent that ignores SSL certificate validation
      agent: httpsAgent
    });
    
    // Log the response status for debugging
    console.log('Backend response status:', backendResponse.status);
    
    // Get the response as text first (in case it's not valid JSON)
    const responseText = await backendResponse.text();
    console.log('Response text preview:', responseText.substring(0, 100));
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Successfully parsed response as JSON');
    } catch (error) {
      console.error('Error parsing response as JSON');
      console.error(error);
      
      // Return the error with a preview of the response
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from backend',
          details: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
        },
        { status: 500 }
      );
    }
    
    // Forward the JSON response to the frontend
    return NextResponse.json(responseData, { 
      status: backendResponse.status,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error: unknown) {
    console.error('Error processing request:', error);
    
    // Return an error response with detailed information
    return NextResponse.json(
      { 
        error: 'Failed to connect to backend server',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}