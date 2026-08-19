import request from 'supertest';

jest.mock('../auth', () => ({
  requireLogin: (req: any, _res: any, next: any) => {
    req.organizationId = 'test-company';
    next();
  }
}));
import app from '../index';
import db from '../db';

describe('PasteBin API Integration Tests', () => {
  let createdPasteId: string;
  let deleteToken: string;

  afterAll(() => {
    db.close();
  });

  test('POST /api/pastes - Create a normal paste', async () => {
    const res = await request(app)
      .post('/api/pastes')
      .send({
        title: 'Test Snippet',
        content: 'console.log("Hello World");',
        language: 'javascript',
        ttl: '1h'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.paste).toHaveProperty('id');
    expect(res.body.paste.title).toBe('Test Snippet');
    expect(res.body.paste.language).toBe('javascript');
    expect(res.body.paste.is_password_protected).toBe(false);

    createdPasteId = res.body.paste.id;
    deleteToken = res.body.paste.delete_token;
  });

  test('GET /api/pastes/:id - Retrieve created paste', async () => {
    const res = await request(app).get(`/api/pastes/${createdPasteId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.paste.content).toBe('console.log("Hello World");');
    expect(res.body.paste.views).toBe(1);
  });

  test('POST /api/pastes - Create paste with custom ID', async () => {
    const customSlug = `custom-slug-${Date.now()}`;
    const res = await request(app)
      .post('/api/pastes')
      .send({
        title: 'Custom ID Test',
        content: 'custom id snippet content',
        custom_id: customSlug
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.paste.id).toBe(customSlug);

    // Duplicate custom ID should fail
    const dupRes = await request(app)
      .post('/api/pastes')
      .send({
        title: 'Dup Custom ID',
        content: 'some content',
        custom_id: customSlug
      });

    expect(dupRes.status).toBe(400);
    expect(dupRes.body.success).toBe(false);
  });

  test('GET /api/pastes/:id/raw - Retrieve raw paste content', async () => {
    const res = await request(app).get(`/api/pastes/${createdPasteId}/raw`);

    expect(res.status).toBe(200);
    expect(res.text).toBe('console.log("Hello World");');
  });

  test('POST /api/pastes - Create burn-after-reading paste', async () => {
    const createRes = await request(app)
      .post('/api/pastes')
      .send({
        title: 'Burn Test',
        content: 'Secret Key 123',
        burn_after_reading: true
      });

    expect(createRes.status).toBe(201);
    const burnId = createRes.body.paste.id;

    // First read gets data
    const readRes1 = await request(app).get(`/api/pastes/${burnId}`);
    expect(readRes1.status).toBe(200);
    expect(readRes1.body.paste.content).toBe('Secret Key 123');

    // Second read fails as paste was burned
    const readRes2 = await request(app).get(`/api/pastes/${burnId}`);
    expect(readRes2.status).toBe(404);
  });

  test('DELETE /api/pastes/:id - Delete paste with token', async () => {
    const deleteRes = await request(app)
      .delete(`/api/pastes/${createdPasteId}`)
      .set('x-delete-token', deleteToken);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const getRes = await request(app).get(`/api/pastes/${createdPasteId}`);
    expect(getRes.status).toBe(404);
  });
});
