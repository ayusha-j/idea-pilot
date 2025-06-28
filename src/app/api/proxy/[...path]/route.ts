// app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// The actual backend URL with IP address
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://a47d-136-232-6-66.ngrok-free.app/api';

// Note: The type definitions for route handlers changed in Next.js 15
// The params type needs to match exactly what Next.js expects

export async function GET(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  return handleRequest(request, context.params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  return handleRequest(request, context.params.path, 'POST');
}

// Define additional methods if needed
export async function PUT(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  return handleRequest(request, context.params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  return handleRequest(request, context.params.path, 'DELETE');
}

/**
 * Generic handler for all HTTP methods
 */
async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
): Promise<NextResponse> {
  try {
    // Join path segments to create the API path
    const apiPath = pathSegments.join('/');
    console.log(`Proxying ${method} request to: ${BACKEND_URL}/${apiPath}`);
    
    // Create request options
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Add body for non-GET/HEAD requests
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const body = await request.json();
        options.body = JSON.stringify(body);
      } catch (error) {
        console.log('No JSON body or invalid JSON');
      }
    }
    
    // Handle query parameters for all request types
    let url = `${BACKEND_URL}/${apiPath}`;
    const searchParams = new URL(request.url).searchParams;
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
    
    // Make the request to the backend
    const response = await fetch(url, options);
    
    // Handle the response
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      // Handle JSON response
      const data = await response.json();
      return NextResponse.json(data, { 
        status: response.status,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      });
    } else {
      // Handle non-JSON response
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'text/plain',
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }
  } catch (error) {
    // Handle any errors
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to backend server',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}