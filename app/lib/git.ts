import simpleGit, { SimpleGit } from 'simple-git';
import type { Commit } from '@/app/types';
import { format } from 'date-fns';

/**
 * Get commit history from local git repository
 */
export async function getLocalCommitHistory(
  repoPath: string = '.',
  branch: string = 'main',
  limit: number = 10
): Promise<Commit[]> {
  const git: SimpleGit = simpleGit(repoPath);
  
  try {
    const log = await git.log({
      maxCount: limit,
      [branch]: true,
    });
    
    return log.all.map(commit => ({
      sha: commit.hash,
      message: commit.message,
      author: commit.author_name,
      date: new Date(commit.date),
      files: [], // Will be populated separately if needed
    }));
  } catch (error) {
    console.error('Error getting commit history:', error);
    return [];
  }
}

/**
 * Get diff between two branches or commits
 */
export async function getDiff(
  repoPath: string = '.',
  from: string = 'main',
  to: string = 'HEAD'
): Promise<string> {
  const git: SimpleGit = simpleGit(repoPath);
  
  try {
    const diff = await git.diff([from, to]);
    return diff;
  } catch (error) {
    console.error('Error getting diff:', error);
    return '';
  }
}

/**
 * Get list of changed files between branches
 */
export async function getChangedFiles(
  repoPath: string = '.',
  from: string = 'main',
  to: string = 'HEAD'
): Promise<string[]> {
  const git: SimpleGit = simpleGit(repoPath);
  
  try {
    const diffSummary = await git.diffSummary([from, to]);
    return diffSummary.files.map(file => file.file);
  } catch (error) {
    console.error('Error getting changed files:', error);
    return [];
  }
}

/**
 * Get current branch name
 */
export async function getCurrentBranch(repoPath: string = '.'): Promise<string> {
  const git: SimpleGit = simpleGit(repoPath);
  
  try {
    const branch = await git.branch();
    return branch.current;
  } catch (error) {
    console.error('Error getting current branch:', error);
    return 'main';
  }
}

