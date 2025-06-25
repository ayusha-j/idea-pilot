import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Proxy received request for regenerate-project');
    
    // Get the request body
    const body = await request.json();
    
    // Forward the request to your Flask backend
    const flaskResponse = await fetch('http://localhost:5000/api/regenerate-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Log the response for debugging
    console.log('Flask response status:', flaskResponse.status);
    
    // Get the response as text first (in case it's not valid JSON)
    const responseText = await flaskResponse.text();
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed response successfully');
    } catch (error) {
      console.error('Error parsing response as JSON:', responseText);
      console.log(error)
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from backend',
          details: responseText.substring(0, 200) + '...' // Include part of the response for debugging
        },
        { status: 500 }
      );
    }
    
    // Forward the response to the frontend
    return NextResponse.json(responseData, { status: flaskResponse.status });
  } catch (error: unknown) {
    console.error('Error proxying to Flask:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to backend server',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}