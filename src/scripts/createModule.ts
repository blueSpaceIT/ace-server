import fs from 'fs';
import path from 'path';

// Function to create a module with dynamic files
const createModule = (moduleName: string): void => {
  const baseDir = path.join(__dirname, '..', 'app', 'modules', moduleName);

  // List of files to be created (removed model.ts)
  const files = [
    `${moduleName}.routes.ts`,
    `${moduleName}.controller.ts`,
    `${moduleName}.service.ts`,
    `${moduleName}.interface.ts`,
    `${moduleName}.validation.ts`,
    `${moduleName}.constant.ts`,
  ];

  // Create module directory if it doesn't exist
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    console.log(`Created directory: ${baseDir}`);
  } else {
    console.log(`Directory exists: ${baseDir}`);
  }

  // Create each file with minimal, modern template
  files.forEach((file) => {
    const filePath = path.join(baseDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`File exists: ${filePath}`);
      return;
    }

    let content = '';

    // Modern, minimal templates for each file
    if (file.endsWith('.routes.ts')) {
      content = `import { Router } from 'express';
import { ${capitalize(moduleName)}Controller } from './${moduleName}.controller';

const router = Router();

// Define routes here

export const ${capitalize(moduleName)}Routes = router;
`;
    } else if (file.endsWith('.controller.ts')) {
      content = `import { Request, Response } from 'express';
import { ${capitalize(moduleName)}Service } from './${moduleName}.service';

export const ${capitalize(moduleName)}Controller = {};
`;
    } else if (file.endsWith('.service.ts')) {
      content = `import { I${capitalize(moduleName)} } from './${moduleName}.interface';

export const ${capitalize(moduleName)}Service = {};
`;
    } else if (file.endsWith('.interface.ts')) {
      content = `

export interface I${capitalize(moduleName)} {
  // Define fields here
}
`;
    } else if (file.endsWith('.validation.ts')) {
      content = `import { z } from 'zod';

export const ${capitalize(moduleName)}Validation = {
  // Define Zod schemas here
};
`;
    } else if (file.endsWith('.constant.ts')) {
      content = `
// Define constants for ${capitalize(moduleName)} module here

export const ${capitalize(moduleName)}Constants = {
  // Example: DEFAULT_LIMIT: 10,
};
`;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Created file: ${filePath}`);
  });
};

// Utility function to capitalize module name
const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

// Get module name from command-line arguments
const moduleName = process.argv[2];
if (!moduleName) {
  console.error('Error: Please provide a module name.');
  process.exit(1);
}

createModule(moduleName);
