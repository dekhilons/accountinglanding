import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // Simulate user verification (replace with actual database lookup and password hashing)
    if (username === 'user@example.com' && password === 'password123') {
      // User is authenticated, generate JWT
      const token = jwt.sign(
        { userId: '123', email: username, roles: ['user'] },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );
      return NextResponse.json({ access_token: token, token_type: 'bearer' });
    } else {
      // Invalid credentials
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
