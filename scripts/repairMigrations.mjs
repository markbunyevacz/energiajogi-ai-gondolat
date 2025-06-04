import { exec } from 'child_process';

function executeCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout) => {
      if (error) reject(error);
      console.log(stdout);
      resolve();
    });
  });
}

async function repairMigrations() {
  try {
    // Repair each migration individually
    const migrations = [
      '20240315000000',
      '20240320000000',
      '20240320000001',
      '20240320',
      '20240321000000',
      '20240322000000',
      '20240323000000',
      '20240324000000',
      '20240324000001',
      '20240520000000'
    ];

    for (const migration of migrations) {
      await executeCommand(`supabase migration repair --status applied ${migration}`);
    }

    await executeCommand('supabase db pull');
    await executeCommand('supabase migration up');
    console.log('Migration repair completed successfully');
  } catch (error) {
    console.error('Migration repair failed:', error);
    process.exit(1);
  }
}

repairMigrations(); 