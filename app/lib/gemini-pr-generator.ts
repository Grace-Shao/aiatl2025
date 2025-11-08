import { getModel } from './gemini-config';
import type { PRDraft, Commit } from '@/app/types';

/**
 * Generate a detailed PR from commit history using Gemini
 * This is the text-only mode (no video required)
 */
export async function generatePRFromCommits(
  commits: Commit[],
  baseBranch: string = 'main',
  headBranch: string = 'feature'
): Promise<PRDraft> {
  const model = getModel('pro');
  
  const commitsText = commits.map(commit => 
    `Commit: ${commit.sha.substring(0, 7)}
Author: ${commit.author}
Date: ${commit.date.toISOString()}
Message: ${commit.message}
Files: ${commit.files.join(', ')}`
  ).join('\n\n');
  
  const prompt = `You are a code review assistant. Analyze these git commits and generate a comprehensive Pull Request.

Commits:
${commitsText}

Generate a detailed PR with:
1. **Title**: Clear, descriptive title (max 72 chars)
2. **Description**: 
   - Overview of changes
   - What problem this solves
   - Key changes made
   - Testing notes (if applicable)
3. **Code Review Comments**: Specific, actionable comments on the code changes
4. **Files Changed**: List of all files modified

Return JSON:
{
  "title": "PR title",
  "body": "Detailed PR description in markdown",
  "base": "${baseBranch}",
  "head": "${headBranch}",
  "files": ["list", "of", "files"],
  "comments": [
    {
      "path": "file/path.ts",
      "line": 42,
      "body": "Review comment about this line"
    }
  ]
}

Only return valid JSON, no markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    
    return {
      title: parsed.title || 'Generated PR',
      body: parsed.body || '',
      base: parsed.base || baseBranch,
      head: parsed.head || headBranch,
      files: parsed.files || commits.flatMap(c => c.files),
      comments: parsed.comments || [],
    };
  } catch (error) {
    console.error('PR generation error:', error);
    // Fallback PR
    return {
      title: `PR: ${commits[0]?.message || 'Changes'}`,
      body: `## Changes\n\n${commits.map(c => `- ${c.message}`).join('\n')}`,
      base: baseBranch,
      head: headBranch,
      files: commits.flatMap(c => c.files),
      comments: [],
    };
  }
}

/**
 * Generate PR description from commit messages and diff text
 */
export async function generatePRFromDiff(
  diffText: string,
  commitMessages: string[],
  baseBranch: string = 'main',
  headBranch: string = 'feature'
): Promise<PRDraft> {
  const model = getModel('pro');
  
  const prompt = `Analyze this git diff and commit messages to generate a Pull Request.

Commit Messages:
${commitMessages.join('\n')}

Diff:
${diffText.substring(0, 8000)}${diffText.length > 8000 ? '\n... (truncated)' : ''}

Generate a comprehensive PR with:
1. Clear title
2. Detailed description explaining the changes
3. Code review comments on specific lines
4. List of files changed

Return JSON:
{
  "title": "PR title",
  "body": "Markdown description",
  "base": "${baseBranch}",
  "head": "${headBranch}",
  "files": ["file1.ts", "file2.ts"],
  "comments": [
    {
      "path": "file.ts",
      "line": 10,
      "body": "Comment text"
    }
  ]
}

Only valid JSON, no markdown.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    
    // Extract files from diff
    const files = Array.from(new Set(
      diffText.match(/^diff --git a\/(.+?) b\//gm)?.map(m => m.split(' ')[2]) || []
    ));
    
    return {
      title: parsed.title || 'Generated PR',
      body: parsed.body || '',
      base: parsed.base || baseBranch,
      head: parsed.head || headBranch,
      files: parsed.files || files,
      comments: parsed.comments || [],
    };
  } catch (error) {
    console.error('PR generation from diff error:', error);
    throw error;
  }
}

