import { Octokit } from '@octokit/rest';
import type { PRDraft, PRComment } from '@/app/types';

let octokit: Octokit | null = null;

export function getGitHubClient() {
  if (octokit) return octokit;
  
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is not set in environment variables');
  }
  
  octokit = new Octokit({ auth: token });
  return octokit;
}

/**
 * Create a draft PR on GitHub
 */
export async function createDraftPR(
  owner: string,
  repo: string,
  pr: PRDraft
): Promise<{ number: number; url: string }> {
  const client = getGitHubClient();
  
  const response = await client.pulls.create({
    owner,
    repo,
    title: pr.title,
    body: pr.body,
    base: pr.base,
    head: pr.head,
    draft: true,
  });
  
  // Add comments if provided
  if (pr.comments && pr.comments.length > 0) {
    await Promise.all(
      pr.comments.map(comment =>
        addPRComment(owner, repo, response.data.number, comment)
      )
    );
  }
  
  return {
    number: response.data.number,
    url: response.data.html_url,
  };
}

/**
 * Add a comment to a PR
 */
export async function addPRComment(
  owner: string,
  repo: string,
  prNumber: number,
  comment: PRComment
): Promise<void> {
  const client = getGitHubClient();
  
  let body = comment.body;
  if (comment.videoSnippetUrl) {
    body += `\n\n[Video snippet](${comment.videoSnippetUrl})`;
  }
  
  if (comment.path && comment.line) {
    // Line comment
    await client.pulls.createReviewComment({
      owner,
      repo,
      pull_number: prNumber,
      body,
      path: comment.path,
      line: comment.line,
    });
  } else {
    // General PR comment
    await client.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });
  }
}

/**
 * Get repository information
 */
export async function getRepoInfo(owner: string, repo: string) {
  const client = getGitHubClient();
  const response = await client.repos.get({ owner, repo });
  return response.data;
}

/**
 * Get commit history
 */
export async function getCommitHistory(
  owner: string,
  repo: string,
  branch: string = 'main',
  limit: number = 10
) {
  const client = getGitHubClient();
  const response = await client.repos.listCommits({
    owner,
    repo,
    sha: branch,
    per_page: limit,
  });
  return response.data;
}

