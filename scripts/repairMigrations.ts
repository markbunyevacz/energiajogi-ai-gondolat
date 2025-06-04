import { exec } from 'child_process';

async function repairMigrations() {
  try {
    await executeCommand('supabase migration repair --status reverted 20240320');
    await executeCommand('supabase db pull');
    await executeCommand('supabase migration up');
    console.log('Migration repair completed successfully');
  } catch (error) {
    console.error('Migration repair failed:', error);
  }
}

function executeCommand(cmd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) reject(error);
      console.log(stdout);
      resolve();
    });
  });
}

repairMigrations(); 