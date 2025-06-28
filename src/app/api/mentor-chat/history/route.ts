// app/api/mentor-chat/history/route.ts
import { NextResponse } from 'next/server';
import https from 'https';

// Create an agent that ignores SSL certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const projectId = url.searchParams.get('projectId');
    
    if (!userId || !projectId) {
      return NextResponse.json(
        { error: 'userId and projectId are required' },
        { status: 400 }
      );
    }
    
    console.log(`Getting chat history for user: ${userId}, project: ${projectId}`);
    
    // Use environment variable for backend URL
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://00fd-136-232-6-66.ngrok-free.app/api';
    const apiUrl = `${BACKEND_URL}/mentor-chat/history?userId=${userId}&projectId=${projectId}`;
    
    console.log(`Forwarding history request to: ${apiUrl}`);
    
    // Forward the request to your Flask backend
    const backendResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      agent: httpsAgent // Ignore SSL certificate issues
    });

    console.log('Backend history response status:', backendResponse.status);
    
    // Get the response as text first
    const responseText = await backendResponse.text();
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`Retrieved ${responseData.history?.length || 0} chat messages`);
    } catch (error) {
      console.error('Error parsing history response as JSON:', error);
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from backend',
          details: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
        },
        { status: 500 }
      );
    }
    
    // Return the chat history to the frontend
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error: any) {
    console.error('Error processing history request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get chat history',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}