const path = require('node:path');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const configPath = ts.findConfigFile(projectRoot, ts.sys.fileExists, 'tsconfig.json');
if (!configPath) throw new Error('tsconfig.json was not found');

const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, projectRoot);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();
const findings = [];
const nativeContainers = new Set([
  'View',
  'Pressable',
  'TouchableOpacity',
  'TouchableHighlight',
  'ScrollView',
  'SafeAreaView',
  'Modal',
  'Animated.View',
  'AnimatedPressable',
]);
const safeTextContainers = new Set(['Text', 'Animated.Text', 'AppButton']);

function tagName(element) {
  if (ts.isJsxElement(element)) return element.openingElement.tagName.getText();
  if (ts.isJsxSelfClosingElement(element)) return element.tagName.getText();
  return null;
}

function addFinding(sourceFile, node, message) {
  const point = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  findings.push(`${path.relative(projectRoot, sourceFile.fileName)}:${point.line + 1}:${point.character + 1} ${message}`);
}

function typeCanRenderAsRawPrimitive(type) {
  if (type.isUnion()) return type.types.some(typeCanRenderAsRawPrimitive);
  const primitiveFlags = ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BigIntLike;
  return (type.flags & primitiveFlags) !== 0;
}

for (const sourceFile of program.getSourceFiles()) {
  if (!sourceFile.fileName.includes(`${path.sep}src${path.sep}`) || !sourceFile.fileName.endsWith('.tsx')) continue;
  if (sourceFile.fileName.endsWith(`${path.sep}SafeChildren.tsx`)) continue;

  function visit(node) {
    if (ts.isJsxText(node) && node.getText().trim()) {
      const container = node.parent;
      const tag = tagName(container);
      if (tag && !safeTextContainers.has(tag)) {
        addFinding(sourceFile, node, `raw JSX text is a child of <${tag}>`);
      }
    }

    if (ts.isJsxExpression(node) && node.expression) {
      const container = node.parent;
      const tag = tagName(container);
      if (tag && nativeContainers.has(tag)) {
        const expression = node.expression;
        if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
          const leftType = checker.getTypeAtLocation(expression.left);
          if (typeCanRenderAsRawPrimitive(leftType)) {
            addFinding(sourceFile, expression.left, `left side of && under <${tag}> can be a string or number`);
          }
        } else if (typeCanRenderAsRawPrimitive(checker.getTypeAtLocation(expression))) {
          addFinding(sourceFile, expression, `expression under <${tag}> can render a raw string or number`);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

if (findings.length) {
  process.stderr.write(`${findings.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('JSX text audit passed: no raw primitive children in native containers.\n');
}
