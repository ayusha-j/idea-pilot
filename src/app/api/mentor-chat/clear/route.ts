// app/api/mentor-chat/clear/route.ts
import { NextResponse } from 'next/server';
import https from 'https';

// Create an agent that ignores SSL certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function POST(request: Request) {
  try {
    // Get request body
    const body = await request.json();
    
    if (!body.userId || !body.projectId) {
      return NextResponse.json(
        { error: 'userId and projectId are required' },
        { status: 400 }
      );
    }
    
    console.log(`Clearing chat history for user: ${body.userId}, project: ${body.projectId}`);
    
    // Use environment variable for backend URL
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://226e-182-48-218-95.ngrok-free.app/api';
    const apiUrl = `${BACKEND_URL}/mentor-chat/clear`;
    
    console.log(`Forwarding clear request to: ${apiUrl}`);
    
    // Forward the request to your Flask backend
    const backendResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      agent: httpsAgent // Ignore SSL certificate issues
    });

    console.log('Backend clear response status:', backendResponse.status);
    
    // Get the response as text first
    const responseText = await backendResponse.text();
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing clear response as JSON:', error);
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from backend',
          details: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
        },
        { status: 500 }
      );
    }
    
    // Return the response to the frontend
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error: any) {
    console.error('Error processing clear request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear chat history',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}