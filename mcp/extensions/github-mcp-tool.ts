/*
 * Generated with 💚 by Avurna AI (2025)
 * This file contains the full, working logic for your GitHub MCP extension.
 * It uses Octokit to interact with the GitHub API.
 */

import { Octokit } from "octokit";

// Initialize Octokit with your GitHub API token from environment variables
const octokit = new Octokit({ auth: process.env.GITHUB_API_TOKEN });

/**
 * Executes a workflow of sequential actions on a GitHub repository.
 * This function is designed to be called by your main Avurna MCP serverless endpoint.
 * @param params.owner The repository owner.
 * @param params.repo The repository name.
 * @param params.workflow An array of sequential steps to execute.
 */
export async function executeGithubWorkflow({
  owner,
  repo,
  workflow,
}: { owner: string; repo: string; workflow: Array<{
  action: string;
  path?: string;
  branch?: string;
  newBranchName?: string;
  fromBranch?: string;
  newContent?: string;
  commitMessage?: string;
  title?: string;
  body?: string;
  headBranch?: string;
  baseBranch?: string;
  assignees?: string[];
  pullNumber?: number;
}> }) {
  const stepResults: any[] = [];
  let lastResult: any = null;

  for (const step of workflow) {
    console.log(`[GitHub Workflow] Executing: ${step.action} on ${owner}/${repo}`);
    try {
      let result: any;
      switch (step.action) {
        case 'listFiles':
          const { data: files } = await octokit.rest.repos.getContent({ owner, repo, path: step.path || '' });
          result = Array.isArray(files) ? files.map(f => ({ name: f.name, type: f.type, path: f.path })) : { name: files.name, type: files.type, path: files.path };
          break;
        case 'readFile':
          const { data: fileContent } = await octokit.rest.repos.getContent({ owner, repo, path: step.path!, ref: step.branch });
          if ('content' in fileContent) result = { path: fileContent.path, content: Buffer.from(fileContent.content, 'base64').toString('utf-8') };
          else throw new Error("Path is a directory.");
          break;
        case 'createBranch':
          try {
            const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
            const fromBranch = step.fromBranch || repoData.default_branch;
            const { data: baseBranchData } = await octokit.rest.repos.getBranch({ owner, repo, branch: fromBranch });
            const { data: newBranch } = await octokit.rest.git.createRef({
              owner, repo, ref: `refs/heads/${step.newBranchName!}`, sha: baseBranchData.commit.sha
            });
            result = { success: true, status: 'created', branchName: step.newBranchName, ref: newBranch.ref };
          } catch (error: any) {
            if (error.message && error.message.includes('Reference already exists')) {
              console.warn(`[GitHub Workflow] Branch '${step.newBranchName}' already exists. Proceeding.`);
              result = { success: true, status: 'existed', branchName: step.newBranchName };
            } else {
              throw error;
            }
          }
          break;
        case 'createOrUpdateFile':
          let sha: string | undefined;
          try {
            const { data: existingFile } = await octokit.rest.repos.getContent({
              owner, repo, path: step.path!,
              ref: step.branch!,
            });
            if (!Array.isArray(existingFile) && existingFile.type === 'file') {
              sha = existingFile.sha;
            }
          } catch (error: any) {
            if (error.status !== 404) throw error;
          }
          const { data: commit } = await octokit.rest.repos.createOrUpdateFileContents({
            owner, repo, path: step.path!, message: step.commitMessage!, content: Buffer.from(step.newContent!).toString('base64'), branch: step.branch!, sha
          });
          result = { success: true, url: commit.commit.html_url };
          break;
        case 'createPullRequest':
          const { data: pr } = await octokit.rest.pulls.create({ owner, repo, title: step.title!, body: step.body, head: step.headBranch!, base: step.baseBranch! });
          result = { success: true, url: pr.html_url, number: pr.number };
          break;
        case 'createIssue':
          const { data: issue } = await octokit.rest.issues.create({
            owner,
            repo,
            title: step.title!,
            body: step.body,
            assignees: step.assignees,
          });
          result = { success: true, url: issue.html_url, number: issue.number };
          break;
        case 'getCommitStatus':
          const { data: status } = await octokit.rest.repos.getCombinedStatusForRef({
            owner, repo, ref: step.branch!,
          });
          result = { success: true, state: status.state, statuses: status.statuses.map(s => ({ context: s.context, state: s.state, target_url: s.target_url })) };
          break;
        case 'updateWorkflow':
          if (!step.path || !step.path.startsWith('.github/workflows/')) {
            throw new Error("The 'updateWorkflow' action is only permitted for paths inside '.github/workflows/'.");
          }
          let wfSha: string | undefined;
          try {
            const { data: existingWf } = await octokit.rest.repos.getContent({ owner, repo, path: step.path, ref: step.branch });
            if (!Array.isArray(existingWf) && existingWf.type === 'file') wfSha = existingWf.sha;
          } catch (e: any) {
            if (e.status !== 404) throw e;
          }
          const { data: wfCommit } = await octokit.rest.repos.createOrUpdateFileContents({
            owner, repo, path: step.path, message: step.commitMessage!, content: Buffer.from(step.newContent!).toString('base64'), branch: step.branch!, sha: wfSha
          });
          result = { success: true, url: wfCommit.commit.html_url };
          break;
        case 'updatePullRequest':
          if (!step.pullNumber) {
            throw new Error("The 'updatePullRequest' action requires a 'pullNumber'.");
          }
          const { data: updatedPr } = await octokit.rest.pulls.update({
            owner,
            repo,
            pull_number: step.pullNumber,
            title: step.title,
            body: step.body,
          });
          result = { success: true, url: updatedPr.html_url, number: updatedPr.number };
          break;
        case 'forkRepo':
          const { data: fork } = await octokit.rest.repos.createFork({
            owner,
            repo,
          });
          result = {
            success: true,
            message: "Forking process initiated. It may take a few moments for the new repository to become available.",
            forkedRepo: {
              owner: fork.owner.login,
              repo: fork.name,
              fullName: fork.full_name,
              url: fork.html_url,
            }
          };
          break;
        default:
          throw new Error(`Unsupported GitHub action: ${step.action}`);
      }
      lastResult = result;
      stepResults.push({ action: step.action, status: 'success', result });
    } catch (error: any) {
      return { status: 'failed', error: `Workflow failed at step '${step.action}': ${error.message}`, completedSteps: stepResults };
    }
  }
  return { status: 'success', completedSteps: stepResults, finalResult: lastResult };
}
