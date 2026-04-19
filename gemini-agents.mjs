#!/usr/bin/env node
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

// Retrieve arguments from the command line
const args = process.argv.slice(2);
const agentType = args[0]?.toLowerCase();
const userPrompt = args.slice(1).join(' ');

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ Error: Please set GEMINI_API_KEY in your .env file');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the personas/system instructions for each sub-agent
const agents = {
  coding: "You are an expert Next.js and Node.js developer. Output only valid, highly optimized, and clean code. Keep explanations concise.",
  design: "You are an expert UX/UI designer and accessibility advocate. Provide design feedback, color palettes, CSS/Tailwind code, and ensure strict adherence to jsx-a11y standards.",
  testing: "You are a QA engineer. Write robust, edge-case-covering unit tests for React components and Node.js backend functions using Jest and React Testing Library.",
  uitest: "You are an SDET. Write End-to-End (E2E) tests using Playwright or Cypress tailored for a Next.js application.",
  deploy: "You are a DevOps and Vercel deployment specialist. Provide Next.js build optimizations, GitHub Actions workflows, and Vercel debugging steps."
};

async function runAgent() {
  if (!agents[agentType]) {
    console.error(`❌ Unknown agent: "${agentType}"`);
    console.log(`✅ Available agents: ${Object.keys(agents).join(', ')}`);
    process.exit(1);
  }

  if (!userPrompt) {
    console.error('❌ Please provide a prompt. Example: node gemini-agents.mjs coding "Create a login button"');
    process.exit(1);
  }

  // Initialize the model with the specific agent's persona
  const agentModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash', // You can change this to gemini-1.5-pro for complex reasoning tasks
    systemInstruction: agents[agentType]
  });

  console.log(`🤖 Starting ${agentType.toUpperCase()} Agent...`);
  console.log(`Generating response, please wait...\n`);

  try {
    const result = await agentModel.generateContent(userPrompt);
    console.log('=========================================');
    console.log(result.response.text());
    console.log('=========================================');
  } catch (error) {
    console.error('❌ Error generating content:', error.message);
  }
}

runAgent();