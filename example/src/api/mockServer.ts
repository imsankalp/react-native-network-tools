import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const posts = [
  { id: 1, title: 'Post 1', body: 'This is post 1' },
  { id: 2, title: 'Post 2', body: 'This is post 2' },
  { id: 3, title: 'Post 3', body: 'This is post 3' },
];

const users = [
  { id: 1, username: 'user1', password: 'password' },
  { id: 2, username: 'user2', password: 'password' },
];

let authToken: string | null = null;

export const server = setupServer(
  // Get posts with various behaviors
  http.get('/api/posts', async ({ request }) => {
    const url = new URL(request.url);

    const delay = url.searchParams.get('delay');
    const status = url.searchParams.get('status');
    const large = url.searchParams.get('large');

    // Simulate delay
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, Number(delay)));
      return HttpResponse.json(posts);
    }

    // Return error status
    if (status) {
      return HttpResponse.json(
        { error: 'Error occurred' },
        { status: Number(status) }
      );
    }

    // Return large payload
    if (large) {
      const largePosts = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Post ${i}`,
        body: 'x'.repeat(1000),
      }));

      return HttpResponse.json(largePosts);
    }

    return HttpResponse.json(posts);
  }),

  // Login endpoint
  http.post('/api/login', async ({ request }) => {
    const body = (await request.json()) as {
      username: string;
      password: string;
    };

    const { username, password } = body;

    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    authToken = `mock-jwt-token-${user.id}`;

    return HttpResponse.json({
      token: authToken,
      user: { id: user.id, username: user.username },
    });
  }),

  // Protected endpoint
  http.get('/api/protected', ({ request }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (token !== authToken) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return HttpResponse.json({
      message: 'This is a protected endpoint',
    });
  })
);
