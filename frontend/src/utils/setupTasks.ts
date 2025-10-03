import { API } from './api';

export interface SetupTaskStatus {
  gitignore: boolean;
  runscript: boolean;
}

/**
 * Check if .gitignore contains worktree patterns
 */
export async function checkGitignoreTask(projectId: number): Promise<boolean> {
  try {
    const response = await window.electronAPI.file.readProject(
      projectId,
      '.gitignore',
    );
    if (!response.success || !response.data) return false;

    const content = response.data as string;
    // Check for common worktree patterns
    return (
      content.includes('/worktrees/') ||
      content.includes('/worktree-*/') ||
      content.includes('worktrees/') ||
      content.includes('worktree-*/')
    );
  } catch (error) {
    // If .gitignore doesn't exist, that's ok - it's not found
    return false;
  }
}

/**
 * Check if project has run scripts configured
 */
export async function checkRunScriptTask(projectId: number): Promise<boolean> {
  try {
    // Get project details to check run script
    const response = await API.projects.getAll();
    if (!response.success || !response.data) return false;

    const projects = response.data as Array<{
      id: number;
      run_script?: string;
    }>;
    const project = projects.find((p) => p.id === projectId);
    return !!(project?.run_script && project.run_script.trim());
  } catch (error) {
    console.error('Error checking run script:', error);
    return false;
  }
}

/**
 * Check all setup tasks and return their status
 */
export async function checkAllSetupTasks(
  projectId: number,
): Promise<SetupTaskStatus> {
  const [gitignore, runscript] = await Promise.all([
    checkGitignoreTask(projectId),
    checkRunScriptTask(projectId),
  ]);

  return { gitignore, runscript };
}

/**
 * Check if any setup tasks are incomplete (setup is needed)
 */
export async function isSetupNeeded(projectId: number): Promise<boolean> {
  const status = await checkAllSetupTasks(projectId);
  return !status.gitignore || !status.runscript;
}

/**
 * Check if all setup tasks are complete
 */
export async function isSetupComplete(projectId: number): Promise<boolean> {
  const status = await checkAllSetupTasks(projectId);
  return status.gitignore && status.runscript;
}
