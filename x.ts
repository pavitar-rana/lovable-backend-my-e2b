// import { Sandbox } from "@e2b/code-interpreter";

// const sbx = await Sandbox.connect("itt4acd16a1gqhcu81wlw", {
//   apiKey: "e2b_7bf1e9aef187048c19bb768a85c8d76903331a43",
// });

// sbx.commands.run("npm install", { cwd: "/home/user" });

// type RemoveC<TType> = TType extends "c" ? never : TType;
// type Letters = "a" | "b" | "c";
// type WowWithoutC = RemoveC<Letters>;

// function printLength<T extends { length: number }>(value: T) {
//   console.log(value.length);
// }
// printLength("hello");
// printLength([1, 2, 3]);

new Promise((r) => setTimeout(r, 5000)).then(() => console.log("hello"));
