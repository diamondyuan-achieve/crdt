const chars = {
  space: "    ",
  pre: "│   ",
  first: "├── ",
  last: "└── ",
};

export interface Tree {
  content: string;
  children: Tree[];
}

export const treeToString = (tree: Tree) => {
  let string = [tree.content];
  if (tree.children && tree.children.length) {
    //@ts-ignore
    string = string.concat(_treeToString(tree.children, []));
  }
  return string.join("\n");
};

const _treeToString = (tree: Tree[], pre: string[]) => {
  let string: string[] = [];
  let childrenPre: string[] = [];

  tree.forEach((node, index) => {
    let last = index === tree.length - 1;
    string.push(
      ([] as string[])
        .concat(pre, last ? chars.last : chars.first, node.content)
        .join("")
    );
    if (node.children && node.children.length) {
      if (pre.length) {
        childrenPre = pre.concat(last ? chars.space : chars.pre);
      } else {
        childrenPre = [last ? chars.space : chars.pre];
      }
      string = string.concat(_treeToString(node.children, childrenPre));
    }
  });
  return string;
};
