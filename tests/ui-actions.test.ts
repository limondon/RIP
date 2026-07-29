import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

function componentFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return componentFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [fullPath] : [];
  });
}

test("every visible button has an action or an explicit state", () => {
  const failures: string[] = [];

  for (const file of componentFiles(path.join(process.cwd(), "src", "components"))) {
    const source = fs.readFileSync(file, "utf8");
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    const visit = (node: ts.Node) => {
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(sourceFile) === "button") {
        const attributes = node.openingElement.attributes.properties
          .filter(ts.isJsxAttribute)
          .map((attribute) => attribute.name.getText(sourceFile));
        const isActionable = ["onClick", "type", "disabled"].some((name) => attributes.includes(name));

        if (!isActionable) {
          const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          failures.push(`${path.relative(process.cwd(), file)}:${position.line + 1}`);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  assert.deepEqual(failures, []);
});
