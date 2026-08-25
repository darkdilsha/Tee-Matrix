// Vercel Serverless Function API Handler
import { handleRequest } from './_server.js';

export default async function handler(req, res) {
  return handleRequest(req, res);
}

