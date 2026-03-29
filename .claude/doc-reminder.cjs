let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    const skip = /TECHNICAL_DESIGN\.md|CHANGELOG\.md|\.claude[\\/]/.test(filePath);
    if (filePath && !skip) {
      const out = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext:
            'REMINDER: A project file was modified. If this was a meaningful code or feature change, please update TECHNICAL_DESIGN.md: ' +
            '(1) bump the "Last Updated" date in the document header, ' +
            '(2) add a new row to the Version History table with the incremented version number and a high-level summary of what changed, ' +
            '(3) update any affected sections such as Component Catalogue, Custom Hooks, Database Schema, API Design, Feature Reference, or SQL Migration Log.'
        }
      };
      console.log(JSON.stringify(out));
    }
  } catch (e) {}
});