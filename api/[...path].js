// Vercel Catch-All Serverless Function API Handler
import { handleRequest } from '../server.js';

export default async function handler(req, res) {
  return handleRequest(req, res);
}

