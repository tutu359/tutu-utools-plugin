import HashCalculator from "./HashCalculator.jsx";
import ShellCommand from "./ShellCommand.jsx";
import Toolbox from "./Toolbox.jsx";

export const toolRegistry = [
  {
    code: "toolbox",
    keyword: "tutu",
    name: "工具箱",
    component: Toolbox,
  },
  {
    code: "hash",
    keyword: "hash",
    name: "哈希计算",
    component: HashCalculator,
  },
  {
    code: "sh",
    keyword: "sh",
    name: "快速 Shell",
    component: ShellCommand,
  },
];

export function getTool(code) {
  return toolRegistry.find((tool) => tool.code === code) ?? toolRegistry[0];
}
