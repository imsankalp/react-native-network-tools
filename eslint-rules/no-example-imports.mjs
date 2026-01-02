export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent imports from example/ directory in library code',
      recommended: true,
    },
    messages: {
      noExampleImports:
        'Importing from example/ directory is not allowed in the library code.',
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        if (
          typeof importPath === 'string' &&
          (importPath.startsWith('example/') ||
            importPath.includes('/example/') ||
            importPath.startsWith('./example/') ||
            importPath.startsWith('../example/'))
        ) {
          context.report({
            node: node.source,
            messageId: 'noExampleImports',
          });
        }
      },
      CallExpression(node) {
        if (
          node.callee.name === 'require' &&
          node.arguments.length > 0 &&
          node.arguments[0].type === 'Literal' &&
          typeof node.arguments[0].value === 'string' &&
          (node.arguments[0].value.startsWith('example/') ||
            node.arguments[0].value.includes('/example/') ||
            node.arguments[0].value.startsWith('./example/') ||
            node.arguments[0].value.startsWith('../example/'))
        ) {
          context.report({
            node: node.arguments[0],
            messageId: 'noExampleImports',
          });
        }
      },
    };
  },
};
