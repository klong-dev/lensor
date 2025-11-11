export const getFile = (
  files: Express.Multer.File[],
  fieldName: string,
): Express.Multer.File | null => {
  const file = files.find((file) => file.fieldname === fieldName);
  return file || null;
};

export const getFileByGroupFileName = (
  files: Express.Multer.File[],
  prefix: string,
): Array<{
  before?: Express.Multer.File;
  after?: Express.Multer.File;
}> => {
  const grouped: Array<{
    before?: Express.Multer.File;
    after?: Express.Multer.File;
  }> = [];

  const regex = new RegExp(`^${prefix}\\[(\\d+)\\]\\[(before|after)\\]$`);

  for (const file of files) {
    const match = file.fieldname.match(regex);
    if (!match) continue;

    const index = match[1];
    const type = match[2];

    if (!grouped[index]) grouped[index] = {};
    grouped[index][type] = file;
  }

  return grouped;
};
