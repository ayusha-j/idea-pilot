// app/api/user-projects/[userId]/route.ts
import { NextResponse } from 'next/server';
import https from 'https';

// Create an agent that ignores SSL certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching projects for user: ${userId}`);
    
    // Use environment variable for backend URL
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://226e-182-48-218-95.ngrok-free.app/api';
    const apiUrl = `${BACKEND_URL}/user-projects/${userId}`;
    
    console.log(`Making request to: ${apiUrl}`);
    
    // Forward the request to your Flask backend
    const backendResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      agent: httpsAgent // Ignore SSL certificate issues
    });

    console.log('Backend response status:', backendResponse.status);
    
    // Get the response as text first
    const responseText = await backendResponse.text();
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`Retrieved ${Array.isArray(responseData) ? responseData.length : 0} projects`);
    } catch (error) {
      console.error('Error parsing response as JSON:', error);
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from backend',
          details: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
        },
        { status: 500 }
      );
    }
    
    // Return the projects to the frontend
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch projects',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}