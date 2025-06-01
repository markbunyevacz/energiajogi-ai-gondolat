import { ImplementationValidator } from '../lib/validation.js';

async function validateImplementation() {
  console.log('Validating implementation...');
  
  const result = await ImplementationValidator.validateImplementation();
  
  if (result.isValid) {
    console.log('✅ Implementation is valid - no mock/dummy code found');
    process.exit(0);
  } else {
    console.error('❌ Implementation validation failed:');
    result.issues.forEach(issue => console.error(`- ${issue}`));
    process.exit(1);
  }
}

validateImplementation().catch(error => {
  console.error('Error during validation:', error);
  process.exit(1);
}); 