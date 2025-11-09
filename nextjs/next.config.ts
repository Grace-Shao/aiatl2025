import type { NextConfig } from "next";
import dotenv from 'dotenv';
dotenv.config();

console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

const nextConfig: NextConfig = {


};

export default nextConfig;
